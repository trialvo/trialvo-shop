# L-4.6 — multi-stage Go license-agent → distroless
FROM golang:1.22-alpine AS build
WORKDIR /src
COPY go.mod ./
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /out/license-agent .

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /out/license-agent /license-agent
USER nonroot:nonroot
EXPOSE 9099
ENTRYPOINT ["/license-agent"]
