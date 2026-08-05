package commands

import (
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"

	"trialvo.dev/license-agent/internal/client"
	"trialvo.dev/license-agent/internal/lease"
)

// Execute handles remote commands. Backup/restore upload is coordinated via
// CONTROL_PLANE; Docker compose wipe runs when DOCKER_COMPOSE_FILE is set.
func Execute(cmd client.Command, c *client.Client, store *lease.Store) (map[string]any, error) {
	switch cmd.Command {
	case "freeze":
		store.Clear()
		return map[string]any{"ok": true, "frozen": true}, nil
	case "unfreeze", "extend":
		return map[string]any{"ok": true, "note": "lease refresh on next tick"}, nil
	case "backup_now":
		return map[string]any{
			"ok":   true,
			"note": "Go agent: trigger Node embedded backup or sidecars; compose flag only",
		}, nil
	case "restore":
		return map[string]any{"ok": true, "note": "restore delegated — use Node client or sidecar"}, nil
	case "destroy_soft":
		return destroy(false, store)
	case "destroy_hard":
		return destroy(true, store)
	default:
		return map[string]any{"ok": true, "skipped": cmd.Command}, nil
	}
}

func destroy(hard bool, store *lease.Store) (map[string]any, error) {
	store.Clear()
	compose := os.Getenv("DOCKER_COMPOSE_FILE")
	projectDir := os.Getenv("COMPOSE_PROJECT_DIR")
	result := map[string]any{"ok": true, "mode": softOrHard(hard), "preDestroy": "required-via-node-or-cp"}
	if compose == "" {
		result["docker"] = "skipped — DOCKER_COMPOSE_FILE not set"
		return result, nil
	}
	args := []string{"compose", "-f", compose, "down"}
	if hard {
		args = append(args, "-v", "--remove-orphans")
	}
	cmd := exec.Command("docker", args...)
	if projectDir != "" {
		cmd.Dir = projectDir
	}
	out, err := cmd.CombinedOutput()
	result["dockerOut"] = string(out)
	if err != nil {
		return result, fmt.Errorf("compose down: %w", err)
	}
	if hard && projectDir != "" {
		_ = os.RemoveAll(filepath.Join(projectDir, "uploads"))
	}
	log.Printf("destroy %v complete", hard)
	return result, nil
}

func softOrHard(hard bool) string {
	if hard {
		return "hard"
	}
	return "soft"
}
