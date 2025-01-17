import { defineStore } from 'pinia';
import axios from 'axios';
import type { ForexRate, ChartData, NewsItem } from '../types/forex';

export const useForexStore = defineStore('forex', {
  state: () => ({
    rates: {} as Record<string, ForexRate>,
    chartData: {} as Record<string, ChartData[]>,
    news: [] as NewsItem[],
    loading: false,
    lastRates: {} as Record<string, number>,
    previousDayRates: {} as Record<string, number>,
  }),

  actions: {
    async fetchPreviousDayRate(currency: string) {
      try {
        const response = await axios.get(
          `https://economia.awesomeapi.com.br/json/daily/${currency}-BRL/2`
        );
        
        if (response.data && response.data.length > 1) {
          const previousDay = response.data[1];
          console.log(`Fechamento anterior ${currency}:`, previousDay);
          this.previousDayRates[currency] = parseFloat(previousDay.ask);
          return previousDay;
        }
      } catch (error) {
        console.error(`Erro ao buscar fechamento anterior para ${currency}:`, error);
      }
      return null;
    },

    async initializePreviousDayRates() {
      const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'];
      console.log('Buscando fechamentos do dia anterior...');
      await Promise.all(currencies.map(this.fetchPreviousDayRate));
      console.log('Fechamentos do dia anterior:', this.previousDayRates);
    },

    async fetchRates() {
      this.loading = true;
      
      try {
        const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'];
        const currencyPairs = currencies.map(curr => `${curr}-BRL`).join(',');
        
        const response = await axios.get(`https://economia.awesomeapi.com.br/json/last/${currencyPairs}`, {
          timeout: 2000
        });
        
        if (response.data) {
          const newRates: Record<string, ForexRate> = {};
          
          currencies.forEach(currency => {
            const pair = `${currency}BRL`;
            const data = response.data[pair];
            
            if (!data) {
              console.error(`Dados não encontrados para ${pair}`);
              return;
            }

            const currentRate = parseFloat(data.ask);
            const previousDayRate = this.previousDayRates[currency];
            
            const changeToday = previousDayRate 
              ? ((currentRate - previousDayRate) / previousDayRate) * 100 
              : 0;

            console.log(`${currency} - Taxa atual: ${currentRate}, Fechamento anterior: ${previousDayRate}, Variação: ${changeToday.toFixed(2)}%`);
            
            this.lastRates[currency] = currentRate;
            
            newRates[currency] = {
              currency,
              rate: currentRate,
              change24h: parseFloat(data.pctChange),
              changeToday: changeToday,
              timestamp: parseInt(data.timestamp),
              createDate: data.create_date
            };
          });
          
          if (JSON.stringify(this.rates) !== JSON.stringify(newRates)) {
            console.table(Object.values(newRates).map(r => ({
              moeda: r.currency,
              taxa: r.rate.toFixed(4),
              var24h: r.change24h.toFixed(2) + '%',
              varHoje: r.changeToday.toFixed(2) + '%',
              horário: new Date(r.timestamp * 1000).toLocaleTimeString()
            })));
            this.rates = newRates;
          }
        }
      } catch (error) {
        console.error('Erro ao buscar taxas:', error);
      } finally {
        this.loading = false;
      }
    },

    async fetchSparklineData(currency: string) {
      try {
        const response = await axios.get(
          `https://economia.awesomeapi.com.br/json/daily/${currency}-BRL/7`
        );
        
        if (response.data && Array.isArray(response.data)) {
          return response.data
            .map(item => parseFloat(item.ask))
            .reverse(); // Reverter para ordem cronológica
        }
        return [];
      } catch (error) {
        console.error(`Erro ao buscar dados históricos para ${currency}:`, error);
        return [];
      }
    }
  }
});