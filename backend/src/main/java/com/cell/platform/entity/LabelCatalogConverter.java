package com.cell.platform.entity;
import com.cell.platform.domain.crop.CellType;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import java.util.Map;
@Converter
public class LabelCatalogConverter implements AttributeConverter<Map<String,String>,String> {
    private static final ObjectMapper JSON = new ObjectMapper();
    public String convertToDatabaseColumn(Map<String,String> value) {
        try { return JSON.writeValueAsString(value == null ? CellType.defaultLabels() : value); }
        catch (Exception e) { throw new IllegalArgumentException("Invalid class catalog",e); }
    }
    public Map<String,String> convertToEntityAttribute(String value) {
        if (value == null) return CellType.defaultLabels();
        try { return JSON.readValue(value,new TypeReference<>(){}); }
        catch (Exception e) { throw new IllegalArgumentException("Invalid class catalog",e); }
    }
}
