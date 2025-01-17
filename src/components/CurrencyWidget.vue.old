<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue';
import { useForexStore } from '../stores/forex';
import type { ForexRate } from '../types/forex';
import { Line } from 'vue-chartjs';
import { 
  format, 
  formatDistance, 
  formatRelative, 
  subDays, 
  addDays, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  endOfYear 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const forexStore = useForexStore();
const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'];
const previousRates = ref<Record<string, number>>({});
const sparklineData = ref<Record<string, any>>({});
const weeklyVariation = ref<Record<string, number>>({});
const updateInterval = ref<ReturnType<typeof setInterval> | null>(null);

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

const sparklineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      enabled: true,
      mode: 'index',
      intersect: false,
      callbacks: {
        label: function(context: any) {
          const value = context.raw.toFixed(4);
          const date = format(new Date(context.dataset.dates[context.dataIndex]), "dd/MM", { locale: ptBR });
          return `${date}: R$ ${value}`;
        }
      }
    }
  },
  scales: {
    x: { 
      display: true,
      grid: {
        display: true,
        drawBorder: true,
        color: 'rgba(0, 0, 0, 0.1)'
      },
      ticks: {
        display: true,
        callback: function(value: any, index: number) {
          return index % 2 === 0 ? format(new Date(this.chart.data.datasets[0].dates[index]), "dd/MM", { locale: ptBR }) : '';
        }
      }
    },
    y: { 
      display: true,
      position: 'right',
      grid: {
        display: true,
        drawBorder: true,
        color: 'rgba(0, 0, 0, 0.1)'
      },
      ticks: {
        display: true,
        callback: function(value: any) {
          return `R$ ${value.toFixed(2)}`;
        }
      }
    }
  },
  elements: {
    point: { 
      radius: 3,
      hoverRadius: 5 
    },
    line: { 
      borderWidth: 2,
      tension: 0.1
    }
  },
  interaction: {
    intersect: false,
    mode: 'index'
  }
};

let ratesInterval: number;
let chartInterval: number;

const startRealtimeUpdates = () => {
  // Primeira atualização imediata
  updateRates();
  updateSparklines();
  
  // Atualização das taxas a cada 3 segundos
  ratesInterval = setInterval(async () => {
    updateRates();
  }, 3000);

  // Atualização dos gráficos a cada minuto
  chartInterval = setInterval(async () => {
    updateSparklines();
  }, 60000);
};

const stopRealtimeUpdates = () => {
  if (ratesInterval) {
    clearInterval(ratesInterval);
  }
  if (chartInterval) {
    clearInterval(chartInterval);
  }
};

const updateRates = async () => {
  console.log('Atualizando taxas:', new Date().toLocaleTimeString());
  await forexStore.fetchRates();
};

const getRateDirection = (currency: string): string => {
  const rate = forexStore.getRate(currency);
  if (!rate) return 'neutral';
  
  const change = rate.change24h;
  if (change > 0) return 'up';
  if (change < 0) return 'down';
  return 'neutral';
};

const getDirectionArrow = (direction: string) => {
  switch (direction) {
    case 'up':
      return '↑';
    case 'down':
      return '↓';
    default:
      return '→';
  }
};

const calculateWeeklyVariation = (data: number[]): number => {
  if (data.length < 2) return 0;
  const firstValue = data[data.length - 1];
  const lastValue = data[0];
  return ((lastValue - firstValue) / firstValue) * 100;
};

const updateSparklines = async () => {
  for (const currency of currencies) {
    const data = await forexStore.fetchSparklineData(currency);
    if (data.length > 0) {
      const variation = calculateWeeklyVariation(data);
      weeklyVariation.value[currency] = variation;
      
      const dates = Array.from({ length: data.length }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (data.length - 1 - i));
        return date.getTime();
      });

      sparklineData.value[currency] = {
        labels: dates.map(date => format(date, "dd/MM", { locale: ptBR })),
        datasets: [{
          data,
          dates,
          borderColor: variation >= 0 ? '#10b981' : '#ef4444',
          tension: 0.1,
          fill: true,
          backgroundColor: (context: any) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 200);
            gradient.addColorStop(0, variation >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            return gradient;
          }
        }]
      };
    }
  }
};

function getCurrencyName(currency: string): string {
  const names: Record<string, string> = {
    USD: 'Dólar Americano',
    EUR: 'Euro',
    GBP: 'Libra Esterlina',
    CAD: 'Dólar Canadense',
    AUD: 'Dólar Australiano',
    JPY: 'Iene Japonês'
  };
  return names[currency] || currency;
}

onMounted(async () => {
  await updateRates();
  await updateSparklines();
  startRealtimeUpdates();
});

onUnmounted(() => {
  stopRealtimeUpdates();
});
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="currency in currencies" :key="currency" 
           class="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
        <div class="p-6">
          <div class="flex justify-between items-start mb-4">
            <div class="flex items-center space-x-3">
              <div class="w-12 h-12 rounded-full overflow-hidden shadow-md border-2 border-gray-100 dark:border-gray-700 flex items-center justify-center bg-white">
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
            <p class="text-4xl font-bold tracking-tight tabular-nums transition-colors duration-300 flex items-center" 
               :class="[
                 getRateDirection(currency) === 'up' ? 'text-green-600 dark:text-green-400' : 
                 getRateDirection(currency) === 'down' ? 'text-red-600 dark:text-red-400' : 
                 'text-gray-900 dark:text-white'
               ]">
              R$ {{ forexStore.getRate(currency)?.rate.toFixed(4) || '0.0000' }}
              <span class="ml-2 text-2xl">
                {{ getDirectionArrow(getRateDirection(currency)) }}
              </span>
            </p>
          </div>

          <div class="flex flex-col gap-6 mb-8">
            <!-- Variação 24h -->
            <div 
              class="flex items-center justify-between px-6 py-4 rounded-lg shadow-lg w-full"
              :class="[
                'transition-all duration-300',
                forexStore.getRate(currency)?.change24h >= 0 ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
              ]"
            >
              <div class="text-3xl font-bold">
                {{ forexStore.getRate(currency)?.change24h >= 0 ? '+' : '' }}{{ forexStore.getRate(currency)?.change24h.toFixed(2) }}%
              </div>
              <div class="text-xl font-medium">24 HORAS</div>
            </div>

            <!-- Variação 7D -->
            <div 
              class="flex items-center justify-between px-6 py-4 rounded-lg shadow-lg w-full"
              :class="[
                'transition-all duration-300',
                weeklyVariation[currency] >= 0 ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
              ]"
            >
              <div class="text-3xl font-bold">
                {{ weeklyVariation[currency] >= 0 ? '+' : '' }}{{ weeklyVariation[currency]?.toFixed(2) }}%
              </div>
              <div class="text-xl font-medium">7 DIAS</div>
            </div>
          </div>

          <div class="h-48">
            <Line
              v-if="sparklineData[currency]"
              :data="sparklineData[currency]"
              :options="sparklineOptions"
              class="h-full w-full"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.max-w-7xl {
  max-width: 1920px;
  margin: 0 auto;
}

.tabular-nums {
  font-variant-numeric: tabular-nums;
}
</style>