package com.cell.platform.dto.request;

import java.util.List;

public record GameRecordRequest(String mode, List<Entry> players) {
    public record Entry(String name, int score) {}
}
