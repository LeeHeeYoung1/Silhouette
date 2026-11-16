import { create } from "zustand";


const useAuthStore = create(set => ({
    token: sessionStorage.getItem('token'),
    id: sessionStorage.getItem('id'),
    login: ({ token, id }) => {
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('id', id);
        set({ token, id })
    },
    logout: () => {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('id');
        set({ token: null, id: null });
    }
}))

export default useAuthStore;