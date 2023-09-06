const elements = {
  form: document.querySelector(".js-search"),
  formContainer: document.querySelector(".js-form-container"),
  addField: document.querySelector(".js-add"),
  list: document.querySelector(".js-list"),
};

elements.addField.addEventListener("click", handlerAddField);
elements.form.addEventListener("submit", handlerSubmit);

function handlerAddField() {
  elements.formContainer.insertAdjacentHTML(
    "beforeend",
    '<input type="text" name="country" class="country-input"/>'
  );
}

async function handlerSubmit(event) {
  event.preventDefault();

  const formData = new FormData(event.currentTarget);
  const countries = formData
    .getAll("country")
    .map((item) => item.trim())
    .filter((item) => item)
    .filter((item, idx, arr) => arr.indexOf(item) === idx);

  try {
    const capitals = await serviceCountry(countries);
    const weather = await serviceWeather(capitals);

    elements.list.innerHTML = createMarkup(weather);
  } catch (err) {
    console.log(err);
  } finally {
    elements.formContainer.innerHTML =
      '<input type="text" name="country" class="country-input"/>';
  }
}

async function serviceCountry(countries) {
  const BASE_URL = "https://restcountries.com/v3.1/name/";

  const responses = countries.map(async (country) => {
    const response = await fetch(`${BASE_URL}${country}`);
    if (!response.ok) {
      // throw new Error(response.statusText);
      return Promise.reject(response.statusText);
    }

    return response.json();
  });

  const data = await Promise.allSettled(responses);
  return data
    .filter(({ status }) => status === "fulfilled")
    .map(({ value }) => value[0].capital[0]);
}

async function serviceWeather(capitals) {
  const BASE_URL = "https://api.weatherapi.com/v1/";
  const END_POINT = "current.json";
  const API_KEY = "6f3bf7a06a84400a8c1181835232108";

  const responses = capitals.map(async (capital) => {
    const params = new URLSearchParams({
      key: API_KEY,
      q: capital,
      lang: "uk",
    });
    const response = await fetch(`${BASE_URL}${END_POINT}?${params}`);
    if (!response.ok) {
      // throw new Error(response.statusText);
      return Promise.reject(response.statusText);
    }

    return response.json();
  });

  const data = await Promise.allSettled(responses);

  return data
    .filter(({ status }) => status === "fulfilled")
    .map(
      ({
        value: {
          current: {
            condition: { text, icon },
            temp_c,
          },
          location: { name, country },
        },
      }) => {
        return { text, icon, temp_c, name, country };
      }
    );
}

function createMarkup(arr) {
  return arr
    .map(
      ({ country, name, temp_c, text, icon }) => `<li class="weather-card">
  <img src="${icon}" alt="${text}">
  <h2>${country}</h2>
  <h2>${name}</h2>
  <p>${text}</p>
  <p>${temp_c} °C</p>
</li>`
    )
    .join("");
}
