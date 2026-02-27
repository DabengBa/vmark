<script setup>
import { ref, onMounted } from 'vue'

const stats = ref(null)
const error = ref(false)

onMounted(async () => {
  try {
    const res = await fetch('https://log.vmark.app/api/stats')
    stats.value = await res.json()
  } catch {
    error.value = true
  }
})
</script>

<template>
  <div v-if="stats && stats.total && stats.total.pings > 0" class="user-stats">
    <div class="stats-grid">
      <div class="stat-item">
        <span class="stat-number">{{ stats.today.ips }}</span>
        <span class="stat-sub">{{ stats.today.pings }} pings</span>
        <span class="stat-label">Today</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{ stats.week.ips }}</span>
        <span class="stat-sub">{{ stats.week.pings }} pings</span>
        <span class="stat-label">This Week</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{ stats.month.ips }}</span>
        <span class="stat-sub">{{ stats.month.pings }} pings</span>
        <span class="stat-label">This Month</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{ stats.total.ips }}</span>
        <span class="stat-sub">{{ stats.total.pings }} pings</span>
        <span class="stat-label">All Time</span>
      </div>
    </div>
    <p class="stats-note">
      Unique IPs / update check pings — actual users may be higher (shared IPs).
      <a href="/guide/privacy">Privacy →</a>
    </p>
  </div>
</template>

<style scoped>
.user-stats {
  margin: 1.5rem 0;
}

.stats-grid {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 90px;
  padding: 1rem 1.25rem;
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  transition: background 0.2s;
}

.stat-item:hover {
  background: var(--vp-c-bg-mute);
}

.stat-number {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--vp-c-brand-1);
  line-height: 1.2;
}

.stat-sub {
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
  margin-top: 0.15rem;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
  margin-top: 0.25rem;
}

.stats-note {
  text-align: center;
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
  margin-top: 0.75rem;
}

.stats-note a {
  color: var(--vp-c-brand-1);
  text-decoration: none;
}

.stats-note a:hover {
  text-decoration: underline;
}
</style>
