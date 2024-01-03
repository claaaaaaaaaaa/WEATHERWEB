let searchInp = document.querySelector('.weather__search');
let city = document.querySelector('.weather__city');
let day = document.querySelector('.weather__day');
let humidity = document.querySelector('.weather__indicator--humidity>.value');
let wind = document.querySelector('.weather__indicator--wind>.value');
let pressure = document.querySelector('.weather__indicator--pressure>.value');
let image = document.querySelector('.weather__image');
let temperature = document.querySelector('.weather__temperature>.value');
let forecastBlock = document.querySelector('.weather__forecast');
let suggestions = document.querySelector('#suggestions');
let weatherAPIKey = 'b03446d58f6cae7a7da97fe8b5f4d417';
let weatherBaseEndpoint = 'https://api.openweathermap.org/data/2.5/weather?units=metric&appid=' + weatherAPIKey;
let forecastBaseEndpoint = 'https://api.openweathermap.org/data/2.5/forecast?units=metric&appid=' + weatherAPIKey;
let cityBaseEndpoint = 'https://api.teleport.org/api/cities/?search=';

let weatherImages = [
    {
        url: 'images/clear-sky.png',
        ids: [800]
    },
    {
        url: 'images/broken-clouds.png',
        ids: [803,804]
    },
    {
        url: 'images/few-clouds.png',
        ids: [801]
    },
    {
        url: 'images/mist.png',
        ids: [701, 711, 721, 731, 741, 751, 761, 762, 771, 781]
    },
    {
        url: 'images/rain.png',
        ids: [500, 501, 502, 503, 504]
    },
    {
        url: 'images/scattered-clouds.png',
        ids: [802]
    },
    {
        url: 'images/shower-rain.png',
        ids: [520, 521, 522, 531, 300, 301, 302, 310, 311, 312, 313, 314, 321]
    },
    {
        url: 'images/snow.png',
        ids: [511, 600, 601, 602, 611, 612, 613, 615, 616, 620, 621, 622]
    },
    {
        url: 'images/thunderstorm.png',
        ids: [200, 201, 202, 210, 211, 212, 221, 230, 231, 232]
    }
]

let getWeatherByCityName = async (cityString) => {
    let city;
    if(cityString.includes(',')) {
        city = cityString.substring(0, cityString.indexOf(',')) + cityString.substring(cityString.lastIndexOf(','));
    } else {
        city = cityString; 
    }
    let endpoint = weatherBaseEndpoint + '&q=' + city;
    let response = await fetch(endpoint);
    if(response.status !== 200) {
        alert('City not found!');
        return;
    }
    let weather = await response.json();
    return weather;
}


let getForecastByCityID = async (id) => {
    let endpoint = forecastBaseEndpoint + '&id=' + id; // Corrected the URL
    let result = await fetch(endpoint);

    if (!result.ok) {
        console.error('Error fetching forecast:', result.status, result.statusText);
        return [];
    }

    let forecast = await result.json();
    let forecastList = forecast.list;
    console.log('API Response for Forecast:', forecastList);

    let daily = [];

    forecastList.forEach(day => {
        let date = new Date(day.dt_txt.replace(' ', 'T'));
        let hours = date.getHours();

        if (hours === 12) {
            let dayData = {
                date: date,
                temperature: day.main.temp,
                conditionId: day.weather[0].id
            };
            daily.push(dayData);
        }
    });

    return daily;
};

let updateForecast = (forecast) => {
    console.log('Received Forecast Data:', forecast);
    forecastBlock.innerHTML = '';
    forecast.forEach(day => {
        let forecastItem = document.createElement('div');
        forecastItem.classList.add('weather__forecast__item');

        let dayName = document.createElement('div');
        dayName.classList.add('weather__forecast__day');
        dayName.textContent = day.date.toLocaleDateString('en-En', { weekday: 'long' });

        let temperature = document.createElement('div');
        temperature.classList.add('weather__forecast__temperature');
        temperature.textContent = day.temperature > 0 ? '+' + Math.round(day.temperature) : Math.round(day.temperature);

        let weatherIcon = document.createElement('img');
        weatherIcon.classList.add('weather__forecast__icon');
        let iconUrl = getWeatherIconUrl(day.conditionId);
        weatherIcon.src = iconUrl;

        forecastItem.appendChild(dayName);
        forecastItem.appendChild(temperature);
        forecastItem.appendChild(weatherIcon);

        forecastBlock.appendChild(forecastItem);
        console.log('Processed Forecast Item:', day);
    });
};

let weatherForCity = async (city) => {
    let weather = await  getWeatherByCityName(city);
        if(!weather) {
            return;
        }
        let cityID = weather.id;
       updateCurrentWeather(weather);
       let forecast = await getForecastByCityID(cityID);
       updateForecast(forecast);
}
let init = () => {
    weatherForCity('Kampala').then(() => document.body.style.filter = 'blur()');
}
init();

searchInp.addEventListener('keydown', async (e) => {
    if(e.keyCode === 13) {
        weatherForCity(searchInp.value);
    }
})

searchInp.addEventListener('input', async () =>{
    let endpoint = cityBaseEndpoint + searchInp.value;
    let result = await (await fetch(endpoint)).json();
    suggestions.innerHTML = '';
    let cities = result._embedded['city:search-results'];
    let length = cities.length > 5 ? 5 : cities.length;
    for(let i = 0; i < length; i++) {
        let option = document.createElement('option');
        option.value = cities[i].matching_full_name;
        suggestions.appendChild(option);
    }
    console.log(result);
})

let updateCurrentWeather = (data) => {
    console.log(data);
    city.textContent = data.name + ', ' + data.sys.country;
    day.textContent = dayOfWeek();
    humidity.textContent = data.main.humidity;
    pressure.textContent = data.main.pressure;

    // Set the weather icon based on the condition ID
    let iconUrl = getWeatherIconUrl(data.weather[0].id);
    image.src = iconUrl;

    let windDirection;
    let deg = data.wind.deg;
    if (deg > 45 && deg <= 135) {
        windDirection = 'East';
    } else if (deg > 135 && deg <= 225) {
        windDirection = 'South';
    } else if (deg > 225 && deg <= 315) {
        windDirection = 'West';
    } else {
        windDirection = 'North';
    }

    wind.textContent = windDirection + ', ' + data.wind.speed;
    temperature.textContent = data.main.temp > 0 ?
        '+' + Math.round(data.main.temp) :
        Math.round(data.main.temp);
};

let dayOfWeek = () => {
    return new Date().toLocaleDateString('en-En', {'weekday': 'long'});
}

let getWeatherIconUrl = (conditionId) => {
    let matchingImage = weatherImages.find(img => img.ids.includes(conditionId));

    if (matchingImage) {
        return matchingImage.url;
    } else {
        // Replace 'default-icon-url' with the URL for your default weather icon
        return 'images/wind.png';
    }
};

