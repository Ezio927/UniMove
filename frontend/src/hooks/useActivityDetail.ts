import { useCallback, useEffect, useState } from 'react';
import { App, Form } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { activityAPI, type Activity } from '../api/activity';
import { commentAPI, type Comment, type CommentStatistics } from '../api/comment';
import { orderAPI } from '../api/order';
import { getErrorMessage } from '../api/error';
import { useAppSelector } from '../store/hooks';

export const useActivityDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { isAuthenticated, user } = useAppSelector(state => state.auth);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [statistics, setStatistics] = useState<CommentStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [userEnrollmentStatus, setUserEnrollmentStatus] = useState(false);
  const [hasCommented, setHasCommented] = useState(false);
  const [form] = Form.useForm();

  const loadActivity = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const response = await activityAPI.getActivityById(id);
      setActivity(response.data.activity);
    } catch (requestError) {
      setError(getErrorMessage(requestError, '加载活动详情失败'));
    } finally { setLoading(false); }
  }, [id]);

  const loadComments = useCallback(async () => {
    if (!id) return;
    setCommentsLoading(true);
    try {
      const response = await commentAPI.getActivityComments(id);
      setComments(response.data.comments);
      setStatistics(response.data.statistics ?? null);
    } catch { setComments([]); setStatistics(null); }
    finally { setCommentsLoading(false); }
  }, [id]);

  const loadUserState = useCallback(async () => {
    if (!isAuthenticated || !user || !id) {
      setUserEnrollmentStatus(false);
      setHasCommented(false);
      return;
    }
    try {
      const [ordersResponse, commentsResponse] = await Promise.all([
        orderAPI.getUserOrders({ limit: 100, status: 'paid' }),
        commentAPI.getUserComments({ limit: 100 })
      ]);
      setUserEnrollmentStatus(ordersResponse.data.orders.some(order => order.activity._id === id));
      setHasCommented(commentsResponse.data.comments.some(comment => comment.activity?._id === id));
    } catch { setUserEnrollmentStatus(false); setHasCommented(false); }
  }, [id, isAuthenticated, user]);

  useEffect(() => { void Promise.all([loadActivity(), loadComments(), loadUserState()]); },
    [loadActivity, loadComments, loadUserState]);

  const handleEnroll = async () => {
    if (!isAuthenticated) return void navigate('/login');
    if (!activity || enrolling || userEnrollmentStatus) return;
    setEnrolling(true);
    try {
      await orderAPI.createOrder({ activityId: activity._id });
      message.success('报名成功');
      setUserEnrollmentStatus(true);
      await loadActivity();
    } catch (requestError) { message.error(getErrorMessage(requestError, '报名失败')); }
    finally { setEnrolling(false); }
  };

  const handleCancelEnrollment = async () => {
    if (!activity) return;
    setCancelling(true);
    try {
      const response = await orderAPI.getUserOrders({ limit: 100, status: 'paid' });
      const order = response.data.orders.find(item => item.activity._id === activity._id);
      if (!order) throw new Error('未找到对应订单');
      await orderAPI.cancelOrder(order._id, { reason: '用户主动取消' });
      message.success('已取消报名');
      setUserEnrollmentStatus(false);
      await loadActivity();
    } catch (requestError) { message.error(getErrorMessage(requestError, '取消报名失败')); }
    finally { setCancelling(false); }
  };

  const handleComment = async (values: { content: string; rating: number }) => {
    if (!id) return;
    setCommentLoading(true);
    try {
      await commentAPI.createComment({ activityId: id, ...values });
      message.success('评论已发布');
      setCommentModalVisible(false);
      form.resetFields();
      setHasCommented(true);
      await loadComments();
    } catch (requestError) { message.error(getErrorMessage(requestError, '评论失败')); }
    finally { setCommentLoading(false); }
  };

  const isOrganizer = activity ? (activity.organizer?._id || activity.organizer?.id) === user?.id : false;
  return { activity, comments, statistics, loading, commentsLoading, error, enrolling, cancelling,
    commentModalVisible, setCommentModalVisible, commentLoading, userEnrollmentStatus,
    canComment: userEnrollmentStatus && !hasCommented, isOrganizer, form, handleEnroll, handleCancelEnrollment,
    handleComment, retry: loadActivity };
};
