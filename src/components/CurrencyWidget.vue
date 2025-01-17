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
  USD: 'https://raw.githubusercontent.com/victormartinez6/Graficos-Cambio-Hoje/master/public/flags/usd.svg',
  EUR: 'https://raw.githubusercontent.com/victormartinez6/Graficos-Cambio-Hoje/master/public/flags/eur.svg',
  GBP: 'https://raw.githubusercontent.com/victormartinez6/Graficos-Cambio-Hoje/master/public/flags/gbp.svg',
  CAD: 'https://raw.githubusercontent.com/victormartinez6/Graficos-Cambio-Hoje/master/public/flags/cad.svg',
  AUD: 'https://raw.githubusercontent.com/victormartinez6/Graficos-Cambio-Hoje/master/public/flags/aud.svg',
  JPY: 'https://raw.githubusercontent.com/victormartinez6/Graficos-Cambio-Hoje/master/public/flags/jpy.svg',
  default: 'https://raw.githubusercontent.com/victormartinez6/Graficos-Cambio-Hoje/master/public/flags/default.svg'
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
        label: (context: any) => {
          return `R$ ${context.parsed.y.toFixed(4)}`;
        }
      }
    }
  },
  scales: {
    x: {
      display: true,
      grid: {
        display: false
      }
    },
    y: {
      display: true,
      grid: {
        display: true
      }
    }
  },
  elements: {
    point: {
      radius: 0
    },
    line: {
      tension: 0.4
    }
  },
  interaction: {
    intersect: false,
    mode: 'index' as const
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
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
    <div v-for="currency in currencies" :key="currency" 
         class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 hover:shadow-xl transition-shadow duration-300">
      <div class="flex items-center space-x-4 mb-4">
        <div class="w-12 h-12 relative overflow-hidden rounded-full border-2 border-gray-200">
          <img :src="getFlagPath(currency)" 
               :alt="`Bandeira ${getCurrencyName(currency)}`" 
               class="w-full h-full object-cover"
               loading="lazy"
               @error="handleImageError">
        </div>
        <div>
          <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">{{ currency }}/BRL</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ getCurrencyName(currency) }}</p>
        </div>
      </div>

      <div class="space-y-2">
        <div class="flex justify-between items-baseline">
          <span class="text-3xl font-bold text-gray-900 dark:text-white">
            {{ formatCurrency(forexStore.rates[currency]?.rate || 0) }}
          </span>
          <div class="flex flex-col items-end">
            <span :class="getVariationClass(forexStore.rates[currency]?.change24h || 0)">
              {{ formatVariation(forexStore.rates[currency]?.change24h || 0) }}
            </span>
            <span class="text-xs text-gray-500">24h</span>
          </div>
        </div>

        <div class="h-20">
          <Line
            v-if="sparklineData[currency]"
            :data="sparklineData[currency]"
            :options="chartOptions"
          />
        </div>

        <div class="text-xs text-gray-500 dark:text-gray-400 text-right">
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
