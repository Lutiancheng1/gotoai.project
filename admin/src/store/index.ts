import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import authReducer from './slices/auth.slice';
import usersReducer from './slices/users.slice';
import departmentsReducer from './slices/departments.slice';
import applicationsReducer from './slices/applications.slice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: usersReducer,
    departments: departmentsReducer,
    applications: applicationsReducer
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector; 