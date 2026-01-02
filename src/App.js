import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import Lottie from 'lottie-react';
import sunAnimation from './assets/sun.json';
import cloudAnimation from './assets/clouds.json';
import rainAnimation from './assets/rain.json';
import snowAnimation from './assets/snow.json';
import loadingAnimation from './assets/loading.json';

const App = () => {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [hourly, setHourly] = useState([]);
  const [todayMinMax, setTodayMinMax] = useState(null);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const API_KEY = '252858f1b3073ed8c5d6def1a7b8a786';

  const fetchWeather = useCallback(async (cityName = city) => {
    if (!cityName) return;
    setLoading(true);

    try {
      const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${API_KEY}&units=metric`);
      const weatherData = await weatherRes.json();
      if (weatherData && weatherData.weather) setWeather(weatherData);

      const forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=${API_KEY}&units=metric`);
      const forecastData = await forecastRes.json();

      if (forecastData && forecastData.list) {
        const grouped = {};

        forecastData.list.forEach(item => {
          const date = item.dt_txt.split(' ')[0];
          if (!grouped[date]) grouped[date] = [];
          grouped[date].push(item);
        });

        const dates = Object.keys(grouped);
        const today = new Date().toISOString().split('T')[0];

        // Get accurate min/max for today
        if (grouped[today]) {
          const todayTemps = grouped[today];
          const min = Math.min(...todayTemps.map(d => d.main.temp_min));
          const max = Math.max(...todayTemps.map(d => d.main.temp_max));
          setTodayMinMax({ min: min.toFixed(1), max: max.toFixed(1) });
        }

        const dailyForecast = dates
          .filter(date => date !== today)
          .slice(0, 5)
          .map(date => {
            const dayData = grouped[date];
            const temps = dayData.map(d => d.main.temp);
            const minTemps = dayData.map(d => d.main.temp_min);
            const maxTemps = dayData.map(d => d.main.temp_max);
            const humidities = dayData.map(d => d.main.humidity);
            const midIndex = Math.floor(dayData.length / 2);
            const icon = dayData[midIndex].weather[0].main;

            return {
              dt: dayData[0].dt,
              dt_txt: date,
              main: {
                temp: (temps.reduce((a, b) => a + b, 0) / temps.length),
                temp_min: Math.min(...minTemps),
                temp_max: Math.max(...maxTemps),
                humidity: Math.round(humidities.reduce((a, b) => a + b, 0) / humidities.length),
              },
              weather: [{ main: icon }],
            };
          });

        setForecast(dailyForecast);
        setHourly(forecastData.list.slice(0, 8));
      }
    } catch (error) {
      console.error("Error fetching weather:", error);
    } finally {
      setLoading(false);
    }
  }, [city]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (city) fetchWeather();
    }, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [city, fetchWeather]);

  const getTime = () => new Date().toLocaleTimeString();

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getBackgroundClass = () => darkMode ? 'app dark' : 'app';

  const renderLottieIcon = (weatherType) => {
    const type = weatherType.toLowerCase();
    const style = { width: 60, height: 60 };
    if (type.includes('cloud')) return <Lottie animationData={cloudAnimation} style={style} />;
    if (type.includes('rain')) return <Lottie animationData={rainAnimation} style={style} />;
    if (type.includes('clear')) return <Lottie animationData={sunAnimation} style={style} />;
    if (type.includes('snow')) return <Lottie animationData={snowAnimation} style={style} />;
    return null;
  };

  return (
    <div className={getBackgroundClass()}>
      {loading && <Lottie animationData={loadingAnimation} className="loading-spinner" />}
      <div className="container">
        <h1>Weather App</h1>
        <button className="dark-toggle" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
        <div className="search-box">
          <input
            type="text"
            placeholder="Enter city name"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <button onClick={() => fetchWeather()}>Search</button>
        </div>

        {weather && weather.main && (
          <div className="weather-box glass">
            <h2>{weather.name}</h2>
            <div className="weather-info">
              {renderLottieIcon(weather.weather[0].main)}
              <div className="weather-details">
                <p>{weather.weather[0].main}</p>
                <p>{weather.main.temp.toFixed(1)} °C</p>
                <p>
                  Min: {todayMinMax ? todayMinMax.min : weather.main.temp_min}°C /
                  Max: {todayMinMax ? todayMinMax.max : weather.main.temp_max}°C
                </p>
                <p>Humidity: {weather.main.humidity}%</p>
                <p className="time">Updated: {getTime()}</p>
              </div>
            </div>
          </div>
        )}

        {forecast.length > 0 && (
          <div className="forecast">
            <h3>5-Day Forecast</h3>
            <div className="forecast-horizontal">
              {forecast.map((item) => (
                <div key={item.dt} className="forecast-card glass">
                  <p className="day">{formatDate(item.dt_txt)}</p>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    {renderLottieIcon(item.weather[0].main)}
                  </div>
                  <p>{item.weather[0].main}</p>
                  <p>{item.main.temp.toFixed(1)} °C</p>
                  <p>Min: {item.main.temp_min.toFixed(1)}°C</p>
                  <p>Max: {item.main.temp_max.toFixed(1)}°C</p>
                  <p>{item.main.humidity}%</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {hourly.length > 0 && (
          <div className="forecast">
            <h3>Hourly Forecast</h3>
            <div className="forecast-horizontal">
              {hourly.map((item) => (
                <div key={item.dt} className="forecast-card glass">
                  <p className="day">{new Date(item.dt_txt).getHours()}:00</p>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    {renderLottieIcon(item.weather[0].main)}
                  </div>
                  <p>{item.weather[0].main}</p>
                  <p>{item.main.temp.toFixed(1)} °C</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
