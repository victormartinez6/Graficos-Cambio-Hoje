<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useForexStore } from '../stores/forex';
import { Line } from 'vue-chartjs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const forexStore = useForexStore();
const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'];
const updateInterval = ref<ReturnType<typeof setInterval> | null>(null);
const sparklineData = ref<Record<string, any>>({});

// Mapa de bandeiras de alta qualidade
const flags: Record<string, string> = {
  USD: 'https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/us.svg',
  EUR: 'https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/eu.svg',
  GBP: 'https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/gb.svg',
  CAD: 'https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/ca.svg',
  AUD: 'https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/au.svg',
  JPY: 'https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/jp.svg',
  default: 'https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/un.svg'
};

const getFlagPath = (currency: string) => {
  return flags[currency] || flags.default;
};

const handleImageError = (e: Event) => {
  const target = e.target as HTMLImageElement;
  if (target && target.src !== flags.default) {
    target.src = flags.default;
  }
};

// Configuração do gráfico
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      enabled: true,
      mode: 'index' as const,
      intersect: false,
      callbacks: {
        title: (items: any[]) => {
          if (!items.length) return '';
          const date = new Date(items[0].parsed.x);
          return format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR });
        },
        label: (context: any) => {
          const value = context.parsed.y;
          return `${getCurrencyName(context.dataset.currency)}: ${formatCurrency(value)}`;
        }
      },
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: 'white',
      bodyColor: 'white',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      padding: 10,
      displayColors: false
    }
  },
  scales: {
    x: {
      type: 'time',
      time: {
        unit: 'hour',
        displayFormats: {
          hour: 'HH:mm'
        }
      },
      display: true,
      grid: {
        display: false
      },
      ticks: {
        maxRotation: 0,
        color: 'rgba(156, 163, 175, 1)',
        font: {
          size: 10
        }
      }
    },
    y: {
      display: true,
      grid: {
        color: 'rgba(243, 244, 246, 1)',
        drawBorder: false
      },
      ticks: {
        color: 'rgba(156, 163, 175, 1)',
        padding: 8,
        callback: (value: number) => formatCurrency(value)
      }
    }
  },
  elements: {
    point: {
      radius: 0,
      hoverRadius: 4,
      hitRadius: 4,
      backgroundColor: 'rgba(59, 130, 246, 1)'
    },
    line: {
      tension: 0.4,
      borderWidth: 2,
      borderColor: 'rgba(59, 130, 246, 1)',
      fill: true,
      backgroundColor: 'rgba(59, 130, 246, 0.1)'
    }
  },
  interaction: {
    intersect: false,
    mode: 'index' as const
  },
  animation: {
    duration: 1000
  }
};

const getCurrencyName = (currency: string): string => {
  const names: Record<string, string> = {
    USD: 'Dólar Americano',
    EUR: 'Euro',
    GBP: 'Libra Esterlina',
    CAD: 'Dólar Canadense',
    AUD: 'Dólar Australiano',
    JPY: 'Iene Japonês'
  };
  return names[currency] || currency;
};

const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
};

const getVariationClass = (variation: number): string => {
  return variation > 0 ? 'text-green-600' : variation < 0 ? 'text-red-600' : 'text-gray-600';
};

const formatVariation = (variation: number): string => {
  const sign = variation > 0 ? '+' : '';
  return `${sign}${variation.toFixed(2)}%`;
};

// Lifecycle hooks
onMounted(() => {
  forexStore.fetchRates();
  updateInterval.value = setInterval(() => {
    forexStore.fetchRates();
  }, 60000);
});

onUnmounted(() => {
  if (updateInterval.value) {
    clearInterval(updateInterval.value);
  }
});
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
    <div v-for="currency in currencies" :key="currency" 
         class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
      <div class="flex items-center space-x-4 mb-6">
        <div class="w-14 h-14 relative overflow-hidden rounded-full border-2 border-gray-200 dark:border-gray-600 shadow-inner">
          <img :src="getFlagPath(currency)" 
               :alt="`Bandeira ${getCurrencyName(currency)}`" 
               class="w-full h-full object-cover transform hover:scale-110 transition-transform duration-300"
               loading="lazy"
               @error="handleImageError">
        </div>
        <div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{{ currency }}/BRL</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 font-medium">{{ getCurrencyName(currency) }}</p>
        </div>
      </div>

      <div class="space-y-4">
        <div class="flex justify-between items-baseline">
          <span class="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {{ formatCurrency(forexStore.rates[currency]?.rate || 0) }}
          </span>
          <div class="flex flex-col items-end">
            <span :class="[
              'font-semibold text-sm',
              getVariationClass(forexStore.rates[currency]?.change24h || 0)
            ]">
              {{ formatVariation(forexStore.rates[currency]?.change24h || 0) }}
            </span>
            <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">24h</span>
          </div>
        </div>

        <div class="h-32 -mx-2">
          <Line
            v-if="sparklineData[currency]"
            :data="sparklineData[currency]"
            :options="chartOptions"
          />
          <div v-else class="h-full flex items-center justify-center">
            <div class="animate-pulse flex space-x-4">
              <div class="h-2 w-2 bg-gray-200 rounded-full"></div>
              <div class="h-2 w-2 bg-gray-200 rounded-full"></div>
              <div class="h-2 w-2 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        </div>

        <div class="text-xs text-gray-500 dark:text-gray-400 text-right font-medium">
          Última atualização: {{ 
            forexStore.rates[currency]?.timestamp 
              ? format(new Date(forexStore.rates[currency].timestamp * 1000), 'HH:mm:ss', { locale: ptBR })
              : '--:--:--'
          }}
        </div>
      </div>
    </div>
  </div>
</template>
