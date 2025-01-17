<script setup lang="ts">
import { ref } from 'vue';
import { SunIcon, MoonIcon } from '@heroicons/vue/24/outline';

const isDarkMode = ref(window.matchMedia('(prefers-color-scheme: dark)').matches);

function toggleDarkMode() {
  isDarkMode.value = !isDarkMode.value;
  document.documentElement.classList.toggle('dark');
}
</script>

<template>
  <div :class="[
    'min-h-screen transition-colors duration-200',
    isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'
  ]">
    <!-- Navbar -->
    <nav class="border-b" :class="isDarkMode ? 'border-gray-800' : 'border-gray-200'">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <h1 class="text-2xl font-bold" :class="isDarkMode ? 'text-white' : 'text-gray-900'">
              Câmbio Hoje
            </h1>
          </div>
          <div class="flex items-center">
            <button
              @click="toggleDarkMode"
              class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
              :aria-label="isDarkMode ? 'Ativar modo claro' : 'Ativar modo escuro'"
            >
              <SunIcon v-if="isDarkMode" class="h-6 w-6 text-yellow-400" />
              <MoonIcon v-else class="h-6 w-6 text-gray-500" />
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <router-view></router-view>
    </main>

    <!-- Footer -->
    <footer class="mt-auto py-4" :class="isDarkMode ? 'border-t border-gray-800' : 'border-t border-gray-200'">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p class="text-center text-sm" :class="isDarkMode ? 'text-gray-400' : 'text-gray-600'">
          {{ new Date().getFullYear() }} Câmbio Hoje. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  </div>
</template>

<style>
.dark {
  color-scheme: dark;
}

.dark body {
  background-color: #111827;
  color: #fff;
}
</style>