package com.cell.platform.service;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly=true)
public class AdminDashboardService {
    private final JdbcTemplate jdbc;
    private final ObjectMapper mapper;
    public record Distribution(Long speciesId, String schema, Map<String,String> labels, Map<String,Long> counts) {}
    public record Dashboard(long students, long professors, long pendingUsers, long inactiveUsers, long smears,
                            long cells, long confirmedCells, long activeCoursework, long pendingLabels,
                            List<Distribution> distributions, LocalDateTime updatedAt) {}
    public Dashboard get() {
        long students = count("SELECT COUNT(*) FROM users WHERE role='STUDENT'");
        long professors = count("SELECT COUNT(*) FROM users WHERE role='EXPERT'");
        long pending = count("SELECT COUNT(*) FROM users WHERE role<>'ADMIN' AND status='PENDING'");
        long inactive = count("SELECT COUNT(*) FROM users WHERE role<>'ADMIN' AND status='INACTIVE'");
        long smears = count("SELECT COUNT(*) FROM tasks WHERE original_filename IS NOT NULL AND original_filename<>'' AND (uploaded_filename IS NULL OR uploaded_filename NOT LIKE 'diagnostic-%')");
        long cells = count("SELECT COUNT(*) FROM crops c JOIN tasks t ON c.task_id=t.id WHERE t.original_filename IS NOT NULL");
        long confirmed = count("SELECT COUNT(*) FROM crops WHERE final_label IS NOT NULL AND excluded=false");
        long pendingLabels = count("SELECT COUNT(*) FROM crops c JOIN tasks t ON c.task_id=t.id WHERE c.excluded=false AND c.final_label IS NULL AND t.status IN ('IN_PROGRESS','COMPLETED')");
        Map<String, List<ScopeRow>> scopes = new HashMap<>();
        jdbc.query("SELECT id,assignment_id,status,deadline_at FROM tasks", rs -> {
            Long assignment = rs.getObject("assignment_id") == null ? null : rs.getLong("assignment_id");
            String key = assignment == null ? "T:"+rs.getLong("id") : "A:"+assignment;
            var timestamp = rs.getTimestamp("deadline_at");
            scopes.computeIfAbsent(key, ignored -> new ArrayList<>()).add(new ScopeRow(rs.getString("status"), timestamp == null ? null : timestamp.toLocalDateTime()));
        });
        LocalDateTime now = LocalDateTime.now();
        long active = scopes.values().stream().filter(rows -> rows.stream().allMatch(r -> Set.of("IN_PROGRESS","COMPLETED").contains(r.status())))
                .filter(rows -> rows.stream().map(ScopeRow::deadline).filter(Objects::nonNull).min(Comparator.naturalOrder()).map(d -> d.isAfter(now)).orElse(true)).count();
        Map<String, Distribution> groups = new LinkedHashMap<>();
        jdbc.query("SELECT t.animal_species_id,t.class_labels,c.final_label,c.amount FROM tasks t JOIN (SELECT task_id,final_label,COUNT(*) amount FROM crops WHERE final_label IS NOT NULL AND excluded=false GROUP BY task_id,final_label) c ON c.task_id=t.id ORDER BY t.id,c.final_label", rs -> {
            Map<String,String> labels;
            try {
                String catalog = rs.getString("class_labels");
                labels = catalog == null ? com.cell.platform.domain.crop.CellType.defaultLabels()
                        : mapper.readValue(catalog, new TypeReference<LinkedHashMap<String,String>>() {});
            }
            catch (Exception e) { throw new IllegalStateException("Cannot read saved class catalog", e); }
            String schema = labels.keySet().stream().sorted().collect(java.util.stream.Collectors.joining("|"));
            Long species = rs.getObject("animal_species_id") == null ? null : rs.getLong("animal_species_id");
            Distribution group = groups.computeIfAbsent(species+":"+schema, ignored -> new Distribution(species, schema, labels, new LinkedHashMap<>()));
            group.counts().merge(rs.getString("final_label"), rs.getLong("amount"), Long::sum);
        });
        return new Dashboard(students, professors, pending, inactive, smears, cells, confirmed, active, pendingLabels, List.copyOf(groups.values()), now);
    }
    private record ScopeRow(String status, LocalDateTime deadline) {}
    private long count(String sql) { return Objects.requireNonNull(jdbc.queryForObject(sql, Long.class)); }
}
