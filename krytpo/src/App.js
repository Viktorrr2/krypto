import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import Chart from 'chart.js/auto';
import './App.css';

const CryptoTracker = () => {
  const [cryptoData, setCryptoData] = useState({
    bitcoin: null,
    ethereum: null,
    litecoin: null,
    neo: null,
    ripple: null,
    stellar: null
  });

  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [selectedInterval] = useState('day'); // Default interval: day

  const chartRef = useRef(null);

  const fetchHistoricalData = useCallback(async (cryptoName, interval) => {
    const response = await axios.get(`https://min-api.cryptocompare.com/data/v2/histoday?fsym=${cryptoName}&tsym=USD&limit=7&aggregate=1`);
    return response.data.Data.Data; // Return historical data array
  }, []);

  const renderChart = useCallback(async (cryptoName) => {
    const historicalData = await fetchHistoricalData(cryptoName, selectedInterval);
    const cryptoChartCanvas = chartRef.current;
    
    // Destroy previous chart
    if (cryptoChartCanvas.chart) {
      cryptoChartCanvas.chart.destroy();
    }

    if (!cryptoChartCanvas || !historicalData) return;

    const cryptoChart = new Chart(cryptoChartCanvas, {
      type: 'line',
      data: {
        labels: historicalData.map(dataPoint => new Date(dataPoint.time * 1000).toLocaleDateString()), // Convert timestamps to date strings
        datasets: [{
          label: `${cryptoName.charAt(0).toUpperCase() + cryptoName.slice(1)} Price (USD)`,
          data: historicalData.map(dataPoint => dataPoint.close), // Extract closing prices
          fill: false,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        }]
      },
    });

    cryptoChartCanvas.chart = cryptoChart; // Store the chart instance on the canvas element
  }, [fetchHistoricalData, selectedInterval]);

  useEffect(() => {
    const fetchData = async () => {
      const symbols = ['BTC', 'ETH', 'LTC', 'NEO', 'XRP', 'XLM'];
      const requests = symbols.map(symbol =>
        axios.get(`https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${symbol}&tsyms=USD`)
      );

      try {
        const responses = await Promise.all(requests);
        const data = {};
        responses.forEach((response, index) => {
          const symbol = symbols[index];
          data[symbol.toLowerCase()] = response.data.DISPLAY[symbol].USD;
        });
        setCryptoData(data);
      } catch (error) {
        console.error('Error fetching crypto data:', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (selectedCrypto) {
      renderChart(selectedCrypto);
    }
  }, [selectedCrypto, renderChart]);

  const handleSearch = () => {
    setSelectedCrypto(searchText.toLowerCase());
  };

  return (
    <div className="crypto-container">
      <div className="crypto-sidebar">
        <h2>Kryptoměny</h2>
        <div className="crypto-search">
          <input type="text" placeholder="Vyhledat kryptoměnu" value={searchText} onChange={e => setSearchText(e.target.value)} />
          <button onClick={handleSearch}>Vyhledat</button>
        </div>
        <div className="crypto-list">
          {Object.keys(cryptoData).map(cryptoName => (
            <button key={cryptoName} className={`list-group-item ${selectedCrypto === cryptoName ? 'active' : ''}`} onClick={() => setSelectedCrypto(cryptoName)}>
              {cryptoName.charAt(0).toUpperCase() + cryptoName.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="crypto-content">
        <h2>Detail kryptoměny</h2>
        {selectedCrypto && (
          <div className="crypto-details">
            <p>Název: {selectedCrypto}</p>
            <p>Aktuální cena: {cryptoData[selectedCrypto]?.PRICE}</p>
            <p>Maximální cena za den: {cryptoData[selectedCrypto]?.HIGHDAY}</p>
            <p>Minimální cena za den: {cryptoData[selectedCrypto]?.LOWDAY}</p>
            <p>Změna za 24 hodin: {cryptoData[selectedCrypto]?.CHANGEPCT24HOUR}%</p>
            <canvas ref={chartRef}></canvas>
          </div>
        )}
      </div>
    </div>
  );
};

export default CryptoTracker;
