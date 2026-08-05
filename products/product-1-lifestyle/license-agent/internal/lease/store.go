package lease

import (
	"os"
	"sync"
)

type Store struct {
	mu    sync.RWMutex
	token string
	path  string
}

func NewStore(path string) *Store {
	s := &Store{path: path}
	if b, err := os.ReadFile(path); err == nil && len(b) > 0 {
		s.token = string(b)
	}
	return s
}

func (s *Store) Set(token string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.token = token
	_ = os.MkdirAll(dirOf(s.path), 0o755)
	_ = os.WriteFile(s.path, []byte(token), 0o600)
}

func (s *Store) Clear() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.token = ""
	_ = os.Remove(s.path)
}

func (s *Store) Get() string {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.token
}

func (s *Store) FrozenOrEmpty() bool {
	return s.Get() == ""
}

func dirOf(p string) string {
	for i := len(p) - 1; i >= 0; i-- {
		if p[i] == '/' || p[i] == '\\' {
			return p[:i]
		}
	}
	return "."
}
