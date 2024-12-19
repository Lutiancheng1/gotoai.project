import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import type { Department } from '@/store/slice/authSlice';

export const useRagflowToken = () => {
  const user = useSelector((state: RootState) => state.auth.user);

  const findRagflowToken = (departments: Department[]): string | null => {
    for (const dept of departments) {
      // 检查当前部门的应用
      const ragflowApp = dept.applications?.find(app => app.type === 'ragflow');
      if (ragflowApp?.config?.token) {
        return ragflowApp.config.token;
      }
      
      // 递归检查子部门
      if (dept.children) {
        const token = findRagflowToken(dept.children);
        if (token) return token;
      }
    }
    return null;
  };

  if (!user?.departments) {
    return null;
  }

  return findRagflowToken(user.departments);
};

export default useRagflowToken; 