import React, { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import sunny from '../assets/images/sunny.png'
import cloudy from '../assets/images/cloudy.png'
import rainy from '../assets/images/rainy.png'
import snowy from '../assets/images/snowy.png'
import loadingGif from '../assets/images/loading.gif'

// Fix for leaflet default icon - use CDN URLs to avoid require error
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const WeatherApp = () => {
  const [data, setData] = useState({})
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [history, setHistory] = useState([])
  const [currentTime, setCurrentTime] = useState(new Date())
  const inputRef = useRef(null)

  const api_key = '0857bdfbf9822bcb5f4d0f481d5e160a'

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formattedTime = currentTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  const fetchWeather = async (city) => {
    setLoading(true)
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=Metric&appid=${api_key}`
      const res = await fetch(url)
      const weatherData = await res.json()
      if (weatherData.cod !== 200) {
        setData({ notFound: true })
      } else {
        setData(weatherData)
        updateHistory(weatherData.name)
      }
    } catch (err) {
      setData({ notFound: true })
    } finally {
      setLoading(false)
    }
  }

  const fetchWeatherByCoords = async (lat, lon) => {
    setLoading(true)
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=Metric&appid=${api_key}`
      const res = await fetch(url)
      const weatherData = await res.json()
      if (weatherData.cod === 200) {
        setData(weatherData)
        updateHistory(weatherData.name)
      } else {
        fetchDefaultWeather()
      }
    } catch {
      fetchDefaultWeather()
    } finally {
      setLoading(false)
    }
  }

  const fetchDefaultWeather = () => fetchWeather('Tbilisi')

  const updateHistory = (city) => {
    setHistory((prev) => {
      const filtered = prev.filter(
        (item) => item.toLowerCase() !== city.toLowerCase()
      )
      const updated = [city, ...filtered].slice(0, 5)
      localStorage.setItem('weatherHistory', JSON.stringify(updated))
      return updated
    })
  }

  useEffect(() => {
    inputRef.current?.focus()

    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchWeatherByCoords(
          position.coords.latitude,
          position.coords.longitude
        )
      },
      () => {
        fetchDefaultWeather()
      }
    )

    const saved = JSON.parse(localStorage.getItem('weatherHistory') || '[]')
    setHistory(saved)
  }, [])

  const handleInputChange = (e) => setLocation(e.target.value)

  const search = async () => {
    if (location.trim() !== '') {
      await fetchWeather(location)
      setLocation('')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') search()
  }

  const toggleDarkMode = () => setDarkMode((prev) => !prev)

  const weatherImages = {
    Clear: sunny,
    Clouds: cloudy,
    Rain: rainy,
    Snow: snowy,
    Haze: cloudy,
    Mist: cloudy,
  }

  const weatherImage = data.weather
    ? weatherImages[data.weather[0].main]
    : null

  // Background gradients
  const lightBackgrounds = {
    Clear: 'linear-gradient(to right, #f3b07c, #fcd283)',
    Clouds: 'linear-gradient(to right, #57d6d4, #71eeec)',
    Rain: 'linear-gradient(to right, #5bc8fb, #80eaff)',
    Snow: 'linear-gradient(to right, #aff2ff, #fff)',
    Haze: 'linear-gradient(to right, #57d6d4, #71eeec)',
    Mist: 'linear-gradient(to right, #57d6d4, #71eeec)',
  }

  const darkBackgrounds = {
    Clear: 'linear-gradient(to top, #4b6cb7, #182848)',
    Clouds: 'linear-gradient(to top, #4b6cb7, #182848)',
    Rain: 'linear-gradient(to top, #4b6cb7, #182848)',
    Snow: 'linear-gradient(to top, #4b6cb7, #182848)',
    Haze: 'linear-gradient(to top, #4b6cb7, #182848)',
    Mist: 'linear-gradient(to top, #4b6cb7, #182848)',
  }

  const weatherMain = data.weather ? data.weather[0].main : null

  const backgroundImage = darkMode
    ? weatherMain && darkBackgrounds[weatherMain]
      ? darkBackgrounds[weatherMain]
      : 'linear-gradient(to top, #4b6cb7, #182848)'
    : weatherMain && lightBackgrounds[weatherMain]
    ? lightBackgrounds[weatherMain]
    : 'linear-gradient(to right, #f3b07c, #fcd283)'

  const currentDate = new Date()
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  const formattedDate = `${daysOfWeek[currentDate.getDay()]}, ${currentDate.getDate()} ${
    months[currentDate.getMonth()]
  }`

  // Get coords for map center, default if missing
  const lat = data.coord?.lat || 41.7151 // Tbilisi default
  const lon = data.coord?.lon || 44.8271

  return (
    <div className={`container ${darkMode ? 'dark' : ''}`}>
      <button
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          padding: '6px 12px',
          cursor: 'pointer',
          zIndex: 10,
          backgroundColor: darkMode ? '#333' : '#eee',
          color: darkMode ? '#eee' : '#333',
          border: 'none',
          borderRadius: '5px',
        }}
        onClick={toggleDarkMode}
      >
        {darkMode ? 'Light Mode' : 'Dark Mode'}
      </button>

      <div
        className="weather-app"
        style={{
          backgroundImage: backgroundImage?.replace
            ? backgroundImage.replace('to right', 'to top')
            : null,
          color: darkMode ? '#eee' : '#333',
          minHeight: '400px',
          borderRadius: '10px',
          padding: '20px',
          maxWidth: '350px',
          margin: '60px auto',
          boxShadow: darkMode
            ? '0 0 15px rgba(255, 255, 255, 0.2)'
            : '0 0 15px rgba(0, 0, 0, 0.2)',
        }}
      >
        <div className="search">
          <div
            className="search-top"
            style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <i className="fa-solid fa-location-dot"></i>
            <div
              className="location"
              style={{ fontWeight: 'bold', fontSize: '1.2rem' }}
            >
              {data.name}
              {data.sys?.country ? `, ${data.sys.country}` : ''}
              {data.sys?.country && (
                <img
                  src={`https://flagsapi.com/${data.sys.country}/flat/24.png`}
                  alt={data.sys.country}
                  style={{ marginLeft: '8px', verticalAlign: 'middle' }}
                />
              )}
            </div>
          </div>

          <div
            className="search-bar"
            style={{ marginTop: 10, display: 'flex', gap: 10 }}
          >
            <input
              ref={inputRef}
              type="text"
              placeholder="Enter Location"
              value={location}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              style={{
                flexGrow: 1,
                padding: '8px',
                borderRadius: '5px',
                border: '1px solid #ccc',
                fontSize: '1rem',
                backgroundColor: darkMode ? '#222' : 'white',
                color: darkMode ? '#eee' : '#333',
              }}
            />
            <button
              onClick={search}
              style={{
                backgroundColor: darkMode ? '#444' : '#ddd',
                border: 'none',
                borderRadius: '5px',
                padding: '8px 12px',
                cursor: 'pointer',
                color: darkMode ? '#eee' : '#333',
              }}
              aria-label="Search"
            >
              🔍
            </button>
          </div>
        </div>

        {loading ? (
          <img
            className="loader"
            src={loadingGif}
            alt="loading"
            style={{
              marginTop: 30,
              width: 80,
              height: 80,
              display: 'block',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          />
        ) : data.notFound ? (
          <div
            className="not-found"
            style={{
              marginTop: 30,
              textAlign: 'center',
              color: darkMode ? '#eee' : '#484569',
            }}
          >
            Not Found 😒
          </div>
        ) : (
          <>
            <div
              className="weather"
              style={{ textAlign: 'center', marginTop: 20 }}
            >
              <img
                src={weatherImage}
                alt={data.weather ? data.weather[0].main : ''}
                width={80}
              />
              <div
                className="weather-type"
                style={{
                  fontSize: '1.3rem',
                  fontWeight: 'bold',
                  marginTop: 10,
                  color: darkMode ? '#eee' : '#484569',
                }}
              >
                {data.weather ? data.weather[0].main : ''}
              </div>
              <div
                className="temp"
                style={{
                  fontSize: '3rem',
                  fontWeight: 'bold',
                  marginTop: 5,
                  color: darkMode ? '#eee' : '#2f2e57',
                }}
              >
                {data.main ? `${Math.floor(data.main.temp)}°C` : ''}
              </div>
            </div>

            <div
              className="weather-date"
              style={{ textAlign: 'center', marginTop: 5, color: darkMode ? '#ccc' : '#484569' }}
            >
              <p>{formattedDate}</p>
              <p style={{ fontSize: '1.1rem', marginTop: '4px' }}>
                {formattedTime}
              </p>
            </div>

            <div
              className="weather-data"
              style={{
                display: 'flex',
                justifyContent: 'space-around',
                marginTop: 20,
              }}
            >
              <div
                className="humidity"
                style={{ textAlign: 'center', color: darkMode ? '#eee' : '#2f2e57' }}
              >
                <div className="data-name">Humidity</div>
                <i className="fa-solid fa-droplet"></i>
                <div className="data">{data.main ? data.main.humidity : ''}%</div>
              </div>
              <div
                className="wind"
                style={{ textAlign: 'center', color: darkMode ? '#eee' : '#2f2e57' }}
              >
                <div className="data-name">Wind</div>
                <i className="fa-solid fa-wind"></i>
                <div className="data">{data.wind ? data.wind.speed : ''} km/h</div>
              </div>
            </div>

            {/* Leaflet Map */}
            <div
              style={{
                marginTop: -65,
                marginBottom: 30,
                height: 150,
                width: '100%',
                borderRadius: 10,
                overflow: 'hidden',
              }}
            >
              <MapContainer
                center={[lat, lon]}
                zoom={10}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
                key={`${lat}-${lon}`} // force remount on location change
              >
                <TileLayer
                  attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[lat, lon]}>
                  <Popup>
                    {data.name} {data.sys?.country}
                  </Popup>
                </Marker>
              </MapContainer>
            </div>

            {history.length > 0 && (
              <div style={{ marginTop: 30, color: darkMode ? '#eee' : '#333' }}>
                <h4>Recent Searches</h4>
                <ul style={{ listStyle: 'none', paddingLeft: 0, paddingTop: 2, }}>
                  {history.map((city, i) => (
                    <li
                      key={i}
                      style={{
                        cursor: 'pointer',
                        padding: '6px 10px',
                        borderBottom: `1px solid ${darkMode ? '#555' : '#ccc'}`,
                      }}
                      onClick={() => fetchWeather(city)}
                    >
                      {city}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default WeatherApp
