import { create } from "zustand";


const useAuthStore = create(set => ({
    token: sessionStorage.getItem('token'),
    id: sessionStorage.getItem('id'),
    role: sessionStorage.getItem('role'),
    
    login: ({ token, id, role }) => {
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('id', id);
        if (role) sessionStorage.setItem('role', role);
       
        set({ token, id, role });
    },
    logout: () => {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('id');
        sessionStorage.removeItem('role');
       
        set({ token: null, id: null, role: null });
    }
}))

export default useAuthStore;