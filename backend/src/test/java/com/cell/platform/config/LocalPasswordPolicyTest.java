package com.cell.platform.config;
import com.cell.platform.service.LocalPasswordPolicy;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import static org.assertj.core.api.Assertions.assertThat;
class LocalPasswordPolicyTest {
    @Test void onlyDefaultAccountsInLocalProfileAreManagedBySettings() {
        var env=new MockEnvironment(); var policy=new LocalPasswordPolicy(env);
        env.setActiveProfiles("prod"); assertThat(policy.managed("local-student")).isFalse();
        env.setActiveProfiles("local");
        assertThat(policy.managed("local-student")).isTrue();
        assertThat(policy.managed("local-professor")).isTrue();
        assertThat(policy.managed("a-custom-account")).isFalse();
    }
}
