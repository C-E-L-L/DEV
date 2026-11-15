package com.cell.platform.service;
import com.cell.platform.domain.crop.CellType;
import com.cell.platform.entity.CellClassEntity;
import com.cell.platform.exception.BadRequestException;
import com.cell.platform.exception.ErrorCode;
import com.cell.platform.infra.species.CellClassJpaRepository;
import com.cell.platform.infra.species.AnimalSpeciesJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service @RequiredArgsConstructor @Transactional
public class CellClassService {
    private final CellClassJpaRepository classes;
    private final AnimalSpeciesJpaRepository species;
    public List<CellClassEntity> list(Long speciesId) {
        if (!species.existsById(speciesId)) throw bad("동물 종을 찾을 수 없습니다.");
        var current=classes.findAllBySpeciesIdOrderByIdAsc(speciesId);
        if (current.isEmpty()) {
            for (CellType type : CellType.values()) classes.save(new CellClassEntity(speciesId,type.name(),type.name()));
            current=classes.findAllBySpeciesIdOrderByIdAsc(speciesId);
        }
        return current;
    }
    public Map<String,String> activeLabels(Long speciesId) {
        if (!species.findById(speciesId).orElseThrow(() -> bad("동물 종을 찾을 수 없습니다.")).isActive()) throw bad("사용 중지된 동물 종으로 새 과제를 만들 수 없습니다.");
        Map<String,String> labels=new LinkedHashMap<>(); list(speciesId).stream().filter(CellClassEntity::isActive).forEach(c -> labels.put(c.getCode(),c.getName()));
        if (labels.isEmpty()) throw bad("출제할 세포 클래스를 하나 이상 활성화해주세요.");
        return labels;
    }
    public CellClassEntity create(Long speciesId,String code,String name) {
        list(speciesId);
        try { CellType.valueOf(code); } catch (IllegalArgumentException e) { throw bad("클래스 코드는 영문자로 시작하는 영문·숫자·밑줄 1~60자입니다."); }
        if (classes.existsBySpeciesIdAndCode(speciesId,code)) throw bad("이미 등록된 클래스 코드입니다. 비활성 클래스를 다시 사용할 수 있습니다.");
        return classes.save(new CellClassEntity(speciesId,code,validName(name)));
    }
    public CellClassEntity update(Long speciesId,Long id,String name,boolean active) {
        var item=classes.findById(id).filter(c -> c.getSpeciesId().equals(speciesId)).orElseThrow(() -> bad("세포 클래스를 찾을 수 없습니다."));
        item.update(validName(name),active); return item;
    }
    private String validName(String name) { if(name == null || name.isBlank() || name.trim().length()>100) throw bad("클래스 이름은 1~100자로 입력해주세요."); return name.trim(); }
    private BadRequestException bad(String message) { return new BadRequestException(message,ErrorCode.G000); }
}
