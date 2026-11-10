package com.cell.platform.entity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
@Entity
@Table(name="cell_classes",uniqueConstraints=@UniqueConstraint(columnNames={"species_id","code"}))
@Getter @NoArgsConstructor
public class CellClassEntity {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="species_id",nullable=false) private Long speciesId;
    @Column(nullable=false,length=60) private String code;
    @Column(nullable=false,length=100) private String name;
    @Column(nullable=false) private boolean active = true;
    public CellClassEntity(Long speciesId,String code,String name) { this.speciesId=speciesId;this.code=code;this.name=name; }
    public void update(String name,boolean active) { this.name=name;this.active=active; }
}
