FROM quay.io/keycloak/keycloak:23.0 AS builder

# Build optimized Keycloak for PostgreSQL with proxy support
ENV KC_PROXY=edge
ENV KC_HEALTH_ENABLED=true
ENV KC_DB=postgres
RUN /opt/keycloak/bin/kc.sh build

FROM quay.io/keycloak/keycloak:23.0

COPY --from=builder /opt/keycloak/ /opt/keycloak/

# Bake realm config into the image
COPY realm-export.json /opt/keycloak/data/import/realm-export.json

# Railway terminates TLS at the load balancer
ENV KC_HTTP_ENABLED=true
ENV KC_PROXY=edge
ENV KC_HEALTH_ENABLED=true
# Allow healthcheck probes that don't match KC_HOSTNAME
ENV KC_HOSTNAME_STRICT=false
ENV KC_HOSTNAME_STRICT_HTTPS=false

EXPOSE 8080

ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
CMD ["start", "--import-realm", "--optimized"]
