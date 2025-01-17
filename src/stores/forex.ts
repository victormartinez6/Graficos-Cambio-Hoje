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
        
        console.log('Buscando taxas de câmbio...');
        console.time('fetchRates');
        
        const response = await axios.get(`https://economia.awesomeapi.com.br/json/last/${currencyPairs}`, {
          timeout: 5000, // Aumentado para 5 segundos
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        console.timeEnd('fetchRates');
        
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
            
            // Validação dos dados
            if (isNaN(currentRate)) {
              console.error(`Taxa inválida para ${currency}: ${data.ask}`);
              return;
            }
            
            const changeToday = previousDayRate 
              ? ((currentRate - previousDayRate) / previousDayRate) * 100 
              : 0;

            // Log detalhado para debugging
            console.log(`${currency}:`, {
              taxa: currentRate.toFixed(4),
              fechamentoAnterior: previousDayRate?.toFixed(4) || 'N/A',
              variacao24h: `${parseFloat(data.pctChange).toFixed(2)}%`,
              variacaoHoje: `${changeToday.toFixed(2)}%`,
              timestamp: new Date(parseInt(data.timestamp) * 1000).toLocaleString()
            });
            
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
          
          // Verifica se houve mudança nas taxas
          const ratesChanged = JSON.stringify(this.rates) !== JSON.stringify(newRates);
          
          if (ratesChanged) {
            console.log('Taxas atualizadas:', new Date().toLocaleString());
            console.table(Object.values(newRates).map(r => ({
              moeda: r.currency,
              taxa: r.rate.toFixed(4),
              var24h: r.change24h.toFixed(2) + '%',
              varHoje: r.changeToday.toFixed(2) + '%',
              horário: new Date(r.timestamp * 1000).toLocaleTimeString()
            })));
            this.rates = newRates;
          } else {
            console.log('Nenhuma mudança nas taxas');
          }
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.code === 'ECONNABORTED') {
            console.error('Timeout ao buscar taxas. A API demorou muito para responder.');
          } else if (error.response) {
            console.error('Erro da API:', error.response.status, error.response.data);
          } else if (error.request) {
            console.error('Sem resposta da API. Verifique sua conexão.');
          } else {
            console.error('Erro ao fazer requisição:', error.message);
          }
        } else {
          console.error('Erro desconhecido:', error);
        }
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