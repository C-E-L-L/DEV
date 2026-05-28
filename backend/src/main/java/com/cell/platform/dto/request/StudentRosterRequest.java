package com.cell.platform.dto.request;

import java.util.List;

public record StudentRosterRequest(
        List<String> studentIds
) {
}
