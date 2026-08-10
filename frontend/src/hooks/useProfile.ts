import { useCallback, useEffect, useState } from 'react';
import { Form, message } from 'antd';
import { commentAPI, type Comment } from '../api/comment';
import { orderAPI, type Order } from '../api/order';
import { userAPI } from '../api/user';
import { updateUser } from '../store/authSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';

export interface ProfileFormData {
  username: string;
  phone?: string;
}

export const useProfile = () => {
  const user = useAppSelector(state => state.auth.user);
  const dispatch = useAppDispatch();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [editCommentModalVisible, setEditCommentModalVisible] = useState(false);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [form] = Form.useForm();
  const [commentForm] = Form.useForm();

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const response = await orderAPI.getUserOrders();
      if (response.success) setOrders(response.data.orders);
    } catch {
      message.error('加载订单失败');
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  const loadComments = useCallback(async () => {
    setCommentsLoading(true);
    try {
      const response = await commentAPI.getUserComments();
      if (response.success) setComments(response.data.comments);
    } catch {
      message.error('加载评论失败');
    } finally {
      setCommentsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) void Promise.all([loadOrders(), loadComments()]);
  }, [user, loadOrders, loadComments]);

  const handleCancelOrder = async (orderId: string) => {
    try {
      await orderAPI.cancelOrder(orderId, { reason: '用户主动取消' });
      message.success('取消报名成功！');
      await loadOrders();
    } catch {
      message.error('取消报名失败，请稍后重试');
    }
  };

  const handleEditComment = (comment: Comment) => {
    setEditingComment(comment);
    commentForm.setFieldsValue({ content: comment.content, rating: comment.rating });
    setEditCommentModalVisible(true);
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await commentAPI.deleteComment(commentId);
      message.success('评论删除成功！');
      await loadComments();
    } catch {
      message.error('删除评论失败，请稍后重试');
    }
  };

  const handleUpdateComment = async (values: { content: string; rating: number }) => {
    if (!editingComment) return;
    try {
      await commentAPI.updateComment(editingComment._id, values);
      message.success('评论更新成功！');
      setEditCommentModalVisible(false);
      setEditingComment(null);
      commentForm.resetFields();
      await loadComments();
    } catch {
      message.error('更新评论失败，请稍后重试');
    }
  };

  const handleUpdateProfile = async (values: ProfileFormData) => {
    setLoading(true);
    try {
      const response = await userAPI.updateProfile(values);
      dispatch(updateUser(response.data.user));
      message.success('更新成功！');
      setEditModalVisible(false);
    } catch {
      message.error('更新失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return {
    user, editModalVisible, setEditModalVisible, loading, orders, comments,
    ordersLoading, commentsLoading, editCommentModalVisible,
    setEditCommentModalVisible, editingComment, setEditingComment,
    form, commentForm, handleCancelOrder, handleEditComment,
    handleDeleteComment, handleUpdateComment, handleUpdateProfile
  };
};
