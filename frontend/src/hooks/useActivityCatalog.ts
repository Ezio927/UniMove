import { useCallback, useEffect, useState } from 'react';
import { App } from 'antd';
import { useNavigate } from 'react-router-dom';
import { activityAPI, type Activity, type ActivityFilters } from '../api/activity';
import { getErrorMessage } from '../api/error';
import { orderAPI } from '../api/order';

export const useActivityCatalog = (filters: ActivityFilters, isAuthenticated: boolean) => {
  const { message } = App.useApp();
  const [activities, setActivities] = useState<Activity[]>([]);
  const navigate = useNavigate();
  const [joining, setJoining] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userOrders, setUserOrders] = useState<string[]>([]);
  const [pagination, setPagination] = useState({ current: 1, total: 0, pageSize: 12 });
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [activitiesResponse, ordersResponse] = await Promise.all([
        activityAPI.getActivities(filters),
        isAuthenticated ? orderAPI.getUserOrders() : Promise.resolve(null)
      ]);
      setActivities(activitiesResponse.data.activities);
      setPagination(previous => ({ ...previous,
        total: activitiesResponse.data.pagination.count,
        current: activitiesResponse.data.pagination.current }));
      setUserOrders(ordersResponse?.data.orders
        .filter(order => order.status === 'paid')
        .map(order => order.activity._id) ?? []);
    } catch (error) {
      setError(getErrorMessage(error, '获取活动列表失败'));
    } finally {
      setLoading(false);
    }
  }, [filters, isAuthenticated]);

  useEffect(() => { void refresh(); }, [refresh]);

  const joinActivity = async (activityId: string) => {
    if (!isAuthenticated) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }
    setJoining(activityId);
    try {
      await orderAPI.createOrder({ activityId });
      message.success('报名成功！');
      await refresh();
    } catch (error) {
      message.error(getErrorMessage(error, '报名失败'));
    } finally { setJoining(null); }
  };

  const leaveActivity = async (activityId: string) => {
    setJoining(activityId);
    try {
      const response = await orderAPI.getUserOrders();
      const order = response.data.orders.find(
        item => item.activity._id === activityId && item.status === 'paid'
      );
      if (!order) throw new Error('未找到对应的订单');
      await orderAPI.cancelOrder(order._id, { reason: '用户主动取消' });
      message.success('取消报名成功！');
      await refresh();
    } catch (error) {
      message.error(getErrorMessage(error, '取消报名失败'));
    } finally { setJoining(null); }
  };

  return { activities, loading, error, userOrders, pagination, setPagination, joining,
    joinActivity, leaveActivity };
};
