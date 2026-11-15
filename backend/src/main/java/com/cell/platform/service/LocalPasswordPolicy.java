package com.cell.platform.service;

import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class LocalPasswordPolicy {
    private final Environment environment;
    public boolean managed(String username) {
        return environment.acceptsProfiles(Profiles.of("local"))
                && Set.of("local-admin", "local-professor", "local-student").contains(username);
    }
}
