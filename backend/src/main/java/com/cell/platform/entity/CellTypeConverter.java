package com.cell.platform.entity;
import com.cell.platform.domain.crop.CellType;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
@Converter(autoApply=true)
public class CellTypeConverter implements AttributeConverter<CellType,String> {
    public String convertToDatabaseColumn(CellType value) { return value == null ? null : value.name(); }
    public CellType convertToEntityAttribute(String value) { return value == null ? null : CellType.valueOf(value); }
}
