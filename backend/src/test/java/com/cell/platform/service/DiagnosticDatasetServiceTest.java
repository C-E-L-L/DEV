package com.cell.platform.service;
import com.cell.platform.domain.crop.CellType;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.test.util.ReflectionTestUtils;
import java.nio.file.*;
import java.util.Map;
import static org.assertj.core.api.Assertions.*;

class DiagnosticDatasetServiceTest {
    @TempDir Path directory;
    private DiagnosticDatasetService dataset(String manifest) throws Exception {
        Files.createDirectories(directory.resolve("crops"));
        Files.write(directory.resolve("crops/dog.png"),new byte[]{1});
        Files.write(directory.resolve("crops/cat.png"),new byte[]{1});
        Files.writeString(directory.resolve("manifest.json"),manifest);
        var service=new DiagnosticDatasetService(new ObjectMapper());
        ReflectionTestUtils.setField(service,"processedDir",directory.toString());return service;
    }
    @Test void poolIsSpeciesScopedDeduplicatedAndSkipsMissingImages() throws Exception {
        var data=dataset("""
            [{"cropFilename":"dog.png","label":"Band","bbox":[0,0,10,10]},
             {"cropFilename":"dog.png","label":"Band","bbox":[0,0,10,10]},
             {"cropFilename":"cat.png","label":"Monocyte","speciesCode":"CAT","bbox":[0,0,10,10]},
             {"cropFilename":"missing.png","label":"Band","bbox":[0,0,10,10]}]
            """);
        assertThat(data.getAvailableCounts("DOG").values().stream().mapToInt(Integer::intValue).sum()).isEqualTo(1);
        assertThat(data.getAvailableCounts("CAT")).containsEntry(CellType.Monocyte,1).containsEntry(CellType.Band,0);
        assertThat(data.sampleCells(Map.of(CellType.Band,1),"DOG")).allMatch(c->c.speciesCode().equals("DOG"));
        assertThatThrownBy(()->data.sampleCells(Map.of(CellType.Band,2),"DOG")).hasMessageContaining("부족");
    }
    @Test void conflictingTruthIsRejected() throws Exception {
        var data=dataset("""
            [{"cropFilename":"dog.png","label":"Band","bbox":[0,0,10,10]},
             {"cropFilename":"dog.png","label":"Monocyte","bbox":[0,0,10,10]}]
            """);
        assertThatThrownBy(()->data.getAvailableCounts("DOG")).hasMessageContaining("유효하지");
    }
}
