import axios from 'axios';

const API = axios.create({ baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api' });

API.interceptors.request.use(req => {
  const token = localStorage.getItem('token');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

export const register = (data) => API.post('/register', data);
export const login = (data) => API.post('/login', data);
export const googleLogin = (accessToken) => API.post('/auth/google', { accessToken });
export const uploadResume = (formData) => API.post('/upload', formData);
export const getResume = (id) => API.get(`/resume/${id}`);
export const getUserResumes = () => API.get('/resumes');

const getGuestId = () => {
  let id = localStorage.getItem('guestId');
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('guestId', id); }
  return id;
};
export const guestUploadResume = (formData) =>
  API.post('/guest/upload', formData, { headers: { 'x-guest-id': getGuestId() } });
export const getGuestResume = (id) =>
  API.get(`/guest/resume/${id}`, { headers: { 'x-guest-id': getGuestId() } });
