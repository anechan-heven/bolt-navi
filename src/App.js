import React, { useState, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, DirectionsService, DirectionsRenderer, Autocomplete } from '@react-google-maps/api';
import Confetti from 'react-confetti';
import './App.css';

const libraries = ['places'];

function App() {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [response, setResponse] = useState(null);
  const [result, setResult] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [time, setTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [gameResult, setGameResult] = useState(null);

  const startAutocompleteRef = useRef(null);
  const endAutocompleteRef = useRef(null);

  useEffect(() => {
    document.body.style.backgroundImage = `url(${process.env.PUBLIC_URL}/background.PNG)`;
    document.body.style.backgroundSize = 'contain';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.style.backgroundAttachment = 'fixed';
    document.body.style.backgroundColor = '#000';
    return () => {
      document.body.style.backgroundImage = '';
      document.body.style.backgroundSize = '';
      document.body.style.backgroundPosition = '';
      document.body.style.backgroundRepeat = '';
      document.body.style.backgroundAttachment = '';
      document.body.style.backgroundColor = '';
    };
  }, []);

  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        setTime((time) => time + 1);
      }, 1000);
    } else if (!isActive && time !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, time]);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "AIzaSyCymAmnwRv0_C3Z0cVwMF1QvlpYde3zMjU",
    libraries
  });

  const directionsCallback = (res) => {
    setCalculating(false);
    if (res !== null) {
      if (res.status === 'OK') {
        setResponse(res);
        const distance = res.routes[0].legs[0].distance.value / 1000; // メートルをキロメートルに変換
        
        const boltSpeed = 44.72; // km/h
        const boltTimeInSeconds = (distance / boltSpeed) * 3600;

        const totalWalkMinutes = Math.round(distance / 5 * 60);
        const walkHours = Math.floor(totalWalkMinutes / 60);
        const walkMinutes = totalWalkMinutes % 60;

        const totalCarMinutes = Math.round(distance / 40 * 60);
        const carHours = Math.floor(totalCarMinutes / 60);
        const carMinutes = totalCarMinutes % 60;

        setResult({
          distance: distance.toFixed(2),
          boltTime: formatTime(boltTimeInSeconds),
          boltTimeSeconds: boltTimeInSeconds,
          walkTime: { hours: walkHours, minutes: walkMinutes },
          carTime: { hours: carHours, minutes: carMinutes },
        });
      } else {
        console.error(`error fetching directions ${res.status}`);
        setResult(null);
        alert(`ルートが見つかりませんでした：${res.status}`)
      }
    }
  }

  const handleCalculate = () => {
    if (start && end) {
      setResponse(null);
      setResult(null);
      setGameStarted(false);
      setGameResult(null);
      setCalculating(true);
    }
  };

  const onPlaceChanged = (autocomplete, type) => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (place && place.formatted_address) {
        if (type === 'start') {
          setStart(place.formatted_address);
        } else {
          setEnd(place.formatted_address);
        }
      }
    } else {
      console.log('Autocomplete is not loaded yet!');
    }
  }

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return { hours, minutes, seconds };
  }

  const handleGameStart = () => {
    setGameStarted(true);
    setIsActive(true);
    setTime(0);
    setGameResult(null);
  }

  const handleGoal = () => {
    setIsActive(false);
    const userTime = time;
    const boltTime = result.boltTimeSeconds;
    if (userTime <= boltTime) {
      setGameResult('勝利！');
    } else {
      setGameResult('敗北...');
    }
  }

  return (
    <div className="container mt-5">
      {gameResult === '勝利！' && <Confetti />}
      <div className="row justify-content-center">
        <div className="col-md-8 text-center">
          <div className="title-header mb-4">
            <img src={process.env.PUBLIC_URL + '/titlelogo.PNG'} alt="ボルナビ" className="app-title-logo" />
            <p className="lead">〜ボルトならこれぐらいで着くけど、君はどう？〜</p>
          </div>

          {!gameStarted ? (
            <div className="content-wrapper">
              <div className="row g-3">
                <div className="col-md">
                  <div className="form-floating">
                    {isLoaded && <Autocomplete
                      onLoad={(ref) => startAutocompleteRef.current = ref}
                      onPlaceChanged={() => onPlaceChanged(startAutocompleteRef.current, 'start')}
                    >
                      <input type="text" className="form-control" id="start" placeholder="出発地" value={start} onChange={(e) => setStart(e.target.value)} />
                    </Autocomplete>}
                  </div>
                </div>
                <div className="col-md">
                  <div className="form-floating">
                    {isLoaded && <Autocomplete
                      onLoad={(ref) => endAutocompleteRef.current = ref}
                      onPlaceChanged={() => onPlaceChanged(endAutocompleteRef.current, 'end')}
                    >
                      <input type="text" className="form-control" id="end" placeholder="目的地" value={end} onChange={(e) => setEnd(e.target.value)} />
                    </Autocomplete>}
                  </div>
                </div>
              </div>
              <button className="btn btn-primary w-100 mt-3" onClick={handleCalculate} disabled={!isLoaded || calculating}>
                {calculating ? '計算中...' : '計算する'}
              </button>
            </div>
          ) : (
            <div className="game-container">
              <h2>あなたのタイム</h2>
              <p className="timer-display">{formatTime(time).hours}時間 {formatTime(time).minutes}分 {formatTime(time).seconds}秒</p>
              <div className="d-grid gap-2 d-md-flex justify-content-md-center">
                <button className="btn btn-warning" onClick={() => setIsActive(!isActive)}>{isActive ? '一時停止' : '再開'}</button>
                <button className="btn btn-success" onClick={handleGoal}>ゴール！</button>
              </div>
            </div>
          )}

          {isLoaded && calculating && (
            <DirectionsService
              options={{
                destination: end,
                origin: start,
                travelMode: 'DRIVING'
              }}
              callback={directionsCallback}
            />
          )}

          {calculating && <div className="loader"></div>}

          {result && !gameStarted && (
            <div className="results-container">
              <h3>計算結果</h3>
              <p><strong>距離: {result.distance} km</strong></p>
              <div className="row">
                <div className="col result-item">
                  <h4><span className="bolt-icon">⚡</span> ボルトの目標タイム</h4>
                  <p>{result.boltTime.hours}時間 {result.boltTime.minutes}分 {result.boltTime.seconds}秒</p>
                </div>
                <div className="col result-item">
                  <h4>🚶 徒歩</h4>
                  <p>{result.walkTime.hours}時間 {result.walkTime.minutes}分</p>
                </div>
                <div className="col result-item">
                  <h4>🚗 車</h4>
                  <p>{result.carTime.hours}時間 {result.carTime.minutes}分</p>
                </div>
              </div>
              <button className="btn btn-success w-100 mt-4" onClick={handleGameStart}>チャレンジ開始！</button>
              {isLoaded && response && (
                <div className="mt-3">
                  <GoogleMap
                    id='direction-example'
                    mapContainerStyle={{
                      height: '400px',
                      width: '100%',
                      borderRadius: '0.25rem'
                    }}
                    zoom={2}
                    center={{
                      lat: 0,
                      lng: -180
                    }}
                  >
                    <DirectionsRenderer
                      options={{
                        directions: response
                      }}
                    />
                  </GoogleMap>
                </div>
              )}
            </div>
          )}

          {gameResult && (
            <div className="game-result-container">
              <h2>結果発表！</h2>
              <h3 className={gameResult === '勝利！' ? 'text-warning' : 'text-light'}>{gameResult}</h3>
              <p>あなたのタイム: {formatTime(time).hours}時間 {formatTime(time).minutes}分 {formatTime(time).seconds}秒</p>
              <p>ボルトのタイム: {result.boltTime.hours}時間 {result.boltTime.minutes}分 {result.boltTime.seconds}秒</p>
              <button className="btn btn-primary mt-3" onClick={() => { setGameStarted(false); setGameResult(null); }}>もう一度挑戦する</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;