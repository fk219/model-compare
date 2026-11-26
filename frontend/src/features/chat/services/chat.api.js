import axios from "axios"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://model-compare-api.onrender.com",
  withCredentials: true,
})

const startBattle = async (problem, modelA, modelB) => {
  const response = await api.post("/api/invoke", {
    problem,
    modelA,
    modelB,
  })

  return response.data
}

export const fetchModels = async () => {
  const response = await api.get("/api/models")
  return response.data
}

export default startBattle
