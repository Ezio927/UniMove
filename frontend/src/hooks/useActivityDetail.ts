import { useCallback, useEffect, useState } from 'react';
import { Form, message } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { activityAPI, type Activity } from '../api/activity';
import { commentAPI, type Comment } from '../api/comment';
import { orderAPI } from '../api/order';
import { useAppSelector } from '../store/hooks';

export const useActivityDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAppSelector(state => state.auth);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [userEnrollmentStatus, setUserEnrollmentStatus] = useState(false);
  const [form] = Form.useForm();

  const loadActivity = useCallback(async () => {
    if (!id) return;
    try {
      const response = await activityAPI.getActivityById(id);
      setActivity(response.data.activity);
    } catch {
      message.error('加载活动详情失败');
      navigate('/activities');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  const loadComments = useCallback(async () => {
    if (!id) return;
    try {
      const response = await commentAPI.getActivityComments(id);
      setComments(response.data.comments);
    } catch { /* 评论失败不阻塞活动详情 */ }
  }, [id]);

  const loadEnrollment = useCallback(async () => {
    if (!isAuthenticated || !user || !id) return setUserEnrollmentStatus(false);
    try {
      const response = await orderAPI.getUserOrders();
      setUserEnrollmentStatus(response.data.orders.some(
        order => order.activity._id === id && order.status === 'paid'
      ));
    } catch { setUserEnrollmentStatus(false); }
  }, [id, isAuthenticated, user]);

  useEffect(() => {
    if (id) void Promise.all([loadActivity(), loadComments(), loadEnrollment()]);
  }, [id, loadActivity, loadComments, loadEnrollment]);

  const handleEnroll = async () => {
    if (!isAuthenticated) return void navigate('/login');
    if (!activity || enrolling || userEnrollmentStatus) return;
    setEnrolling(true);
    try {
      await orderAPI.createOrder({ activityId: activity._id });
      message.success('报名成功！');
      setUserEnrollmentStatus(true);
      await loadActivity();
    } catch { message.error('报名失败，请稍后重试'); }
    finally { setEnrolling(false); }
  };

  const handleCancelEnrollment = async () => {
    if (!activity) return;
    setCancelling(true);
    try {
      const response = await orderAPI.getUserOrders();
      const order = response.data.orders.find(
        item => item.activity._id === activity._id && item.status === 'paid'
      );
      if (!order) throw new Error('未找到对应订单');
      await orderAPI.cancelOrder(order._id, { reason: '用户主动取消' });
      message.success('取消报名成功！');
      setUserEnrollmentStatus(false);
      await loadActivity();
    } catch { message.error('取消报名失败，请稍后重试'); }
    finally { setCancelling(false); }
  };

  const handleComment = async (values: { content: string; rating: number }) => {
    if (!id) return;
    setCommentLoading(true);
    try {
      await commentAPI.createComment({ activityId: id, ...values });
      message.success('评论成功！');
      setCommentModalVisible(false);
      form.resetFields();
      await loadComments();
    } catch { message.error('评论失败，请稍后重试'); }
    finally { setCommentLoading(false); }
  };

  return { activity, comments, loading, enrolling, cancelling,
    commentModalVisible, setCommentModalVisible, commentLoading,
    userEnrollmentStatus, form, handleEnroll, handleCancelEnrollment, handleComment };
};
