package com.applebay.backend.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Collection;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory SSE hub. Each connected student holds one emitter, registered
 * under every course they are enrolled in. Single-instance only: running
 * several backend instances would need Redis pub/sub or Postgres NOTIFY.
 */
@Component
public class LiveSessionEvents {

    private final Map<Long, Set<SseEmitter>> byCourse =
            new ConcurrentHashMap<>();

    public SseEmitter subscribe(Collection<Long> courseIds) {
        SseEmitter emitter = new SseEmitter(0L);

        for (Long courseId : courseIds) {
            byCourse.computeIfAbsent(
                    courseId, id -> ConcurrentHashMap.newKeySet())
                    .add(emitter);
        }

        Runnable remove = () -> byCourse.values()
                .forEach(emitters -> emitters.remove(emitter));

        emitter.onCompletion(remove);
        emitter.onTimeout(remove);
        emitter.onError(error -> remove.run());

        send(emitter, "connected", "ok");
        return emitter;
    }

    /**
     * Tells every student enrolled in the course that its session changed.
     * Inside a transaction the event waits for commit, so a rollback never
     * announces a change that did not happen.
     */
    public void sessionChanged(Long courseId) {
        Runnable publish = () -> byCourse
                .getOrDefault(courseId, Set.of())
                .forEach(emitter -> send(
                        emitter, "session-changed", courseId));

        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(
                    new TransactionSynchronization() {
                        @Override
                        public void afterCommit() {
                            publish.run();
                        }
                    });
        } else {
            publish.run();
        }
    }

    // Keeps proxies from closing idle streams and clears dead connections.
    @Scheduled(fixedRate = 25_000)
    void heartbeat() {
        byCourse.values().stream()
                .flatMap(Set::stream)
                .distinct()
                .forEach(emitter -> send(emitter, "ping", ""));
    }

    private void send(SseEmitter emitter, String event, Object data) {
        try {
            emitter.send(SseEmitter.event().name(event).data(data));
        } catch (IOException | IllegalStateException exception) {
            emitter.complete();
        }
    }
}
