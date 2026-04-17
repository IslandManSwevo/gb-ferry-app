FROM quay.io/keycloak/keycloak:23.0 AS builder

# Build optimized Keycloak for PostgreSQL
RUN /opt/keycloak/bin/kc.sh build --db=postgres

FROM quay.io/keycloak/keycloak:23.0

COPY --from=builder /opt/keycloak/ /opt/keycloak/

# Bake realm config into the image
COPY realm-export.json /opt/keycloak/data/import/realm-export.json

# Railway terminates TLS at the load balancer
ENV KC_HTTP_ENABLED=true
ENV KC_PROXY=edge
ENV KC_HEALTH_ENABLED=true

EXPOSE 8080

ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
CMD ["start", "--import-realm", "--optimized"]
