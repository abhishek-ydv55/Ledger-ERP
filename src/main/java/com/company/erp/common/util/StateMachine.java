package com.company.erp.common.util;

import com.company.erp.common.exception.BusinessRuleViolationException;

import java.util.Map;
import java.util.Set;

public class StateMachine<S extends Enum<S>> {

    private final Map<S, Set<S>> allowedTransitions;

    public StateMachine(Map<S, Set<S>> allowedTransitions) {
        this.allowedTransitions = allowedTransitions;
    }

    public void validateTransition(S currentStatus, S newStatus) {
        Set<S> allowed = allowedTransitions.getOrDefault(currentStatus, Set.of());
        if (!allowed.contains(newStatus)) {
            throw new BusinessRuleViolationException("Invalid status transition from " + currentStatus + " to " + newStatus);
        }
    }
}
