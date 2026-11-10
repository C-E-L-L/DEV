package com.cell.platform.domain.crop;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/** Stable label code. Choices are validated against each task's saved catalog. */
public final class CellType {
    private static final Map<String,CellType> CODES = new ConcurrentHashMap<>();
    public static final CellType Band = valueOf("Band"), Segment = valueOf("Segment"),
            Lymphocyte = valueOf("Lymphocyte"), Monocyte = valueOf("Monocyte"),
            Eosinophil = valueOf("Eosinophil"), NucleatedRBC = valueOf("NucleatedRBC");
    private final String code;
    private CellType(String code) { this.code = code; }
    @JsonCreator public static CellType valueOf(String code) {
        if (code == null || !code.matches("[A-Za-z][A-Za-z0-9_]{0,59}") || "UNKNOWN".equals(code)) throw new IllegalArgumentException("Invalid cell code");
        return CODES.computeIfAbsent(code,CellType::new);
    }
    public static CellType[] values() { return new CellType[]{Band,Segment,Lymphocyte,Monocyte,Eosinophil,NucleatedRBC}; }
    public static Map<String,String> defaultLabels() {
        Map<String,String> labels = new LinkedHashMap<>(); for (CellType type : values()) labels.put(type.name(),type.name()); return labels;
    }
    @JsonValue public String name() { return code; }
    @Override public String toString() { return code; }
}
