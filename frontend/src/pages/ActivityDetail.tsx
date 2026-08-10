import React from 'react';
import { Alert, Avatar, Button, Card, Col, Empty, Form, Input, List, Modal, Progress, Rate, Result, Row, Skeleton, Space, Tag, Typography } from 'antd';
import { CalendarOutlined, CommentOutlined, EnvironmentOutlined, HeartFilled, HeartOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useActivityDetail } from '../hooks/useActivityDetail';
import { useFavorites } from '../hooks/useFavorites';
import { useAppSelector } from '../store/hooks';
import './ActivityDetail.css';

const ActivityDetail: React.FC = () => {
  const navigate = useNavigate();
  const [favoriteActionAttempted, setFavoriteActionAttempted] = React.useState(false);
  const { isAuthenticated } = useAppSelector(state => state.auth);
  const { favoriteIds, error: favoritesError, mutatingId, toggleFavorite, reload: reloadFavorites } = useFavorites(isAuthenticated);
  const { activity, comments, statistics, loading, commentsLoading, error, enrolling, cancelling,
    commentModalVisible, setCommentModalVisible, commentLoading, userEnrollmentStatus, canComment,
    isOrganizer, form, handleEnroll, handleCancelEnrollment, handleComment, retry } = useActivityDetail();

  if (loading) return <Card className="detail-skeleton"><Skeleton active avatar paragraph={{ rows: 8 }} /></Card>;
  if (error || !activity) return <Result status="warning" title="无法打开这个活动" subTitle={error || '活动不存在'}
    extra={<Space><Button type="primary" onClick={() => void retry()}>重试</Button><Button onClick={() => navigate('/activities')}>返回活动列表</Button></Space>} />;

  const full = activity.currentParticipants >= activity.maxParticipants;
  const past = dayjs(activity.startTime).isBefore(dayjs());
  const enrollmentPercent = Math.min(100, Math.round(activity.currentParticipants / activity.maxParticipants * 100));
  const isFavorite = favoriteIds.has(activity._id);
  const handleFavorite = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setFavoriteActionAttempted(true);
    void toggleFavorite(activity._id);
  };
  const retryFavorites = () => {
    setFavoriteActionAttempted(false);
    void reloadFavorites();
  };

  return (
    <div className="activity-detail-page">
      <section className="detail-hero">
        <div className="detail-cover">
          {activity.images?.[0] ? <img src={activity.images[0]} alt={activity.title} />
            : <div className="detail-cover-placeholder"><CalendarOutlined /><span>暂无活动图片</span></div>}
        </div>
        <Card className="detail-summary">
          <Space wrap><Tag color="blue">{activity.category}</Tag><Tag>{past ? '已结束' : full ? '已满员' : '报名中'}</Tag></Space>
          <Typography.Title>{activity.title}</Typography.Title>
          <div className="detail-meta">
            <span><CalendarOutlined /><strong>时间</strong>{dayjs(activity.startTime).format('YYYY年MM月DD日 HH:mm')} – {dayjs(activity.endTime).format('HH:mm')}</span>
            <span><EnvironmentOutlined /><strong>地点</strong>{activity.location}</span>
            <span><UserOutlined /><strong>组织者</strong>{activity.organizer?.username || '未知用户'}</span>
          </div>
          <div className="capacity-block">
            <div><span>报名进度</span><strong>{activity.currentParticipants} / {activity.maxParticipants} 人</strong></div>
            <Progress percent={enrollmentPercent} showInfo={false} />
          </div>
          <div className="detail-price">{activity.price === 0 ? '免费活动' : `¥${activity.price}`}</div>
          {isOrganizer ? <Alert showIcon type="info" message="这是你创建的活动" /> : userEnrollmentStatus ? (
            <Space.Compact block><Button block disabled icon={<TeamOutlined />}>已报名</Button><Button danger loading={cancelling} onClick={handleCancelEnrollment}>取消报名</Button></Space.Compact>
          ) : <Space.Compact block><Button block type="primary" size="large" icon={<TeamOutlined />} loading={enrolling}
            disabled={past || full} onClick={handleEnroll}>{past ? '活动已结束' : full ? '名额已满' : '立即报名'}</Button></Space.Compact>}
          <Button block aria-label={isFavorite ? '取消收藏' : '收藏活动'} loading={mutatingId === activity._id}
            icon={isFavorite ? <HeartFilled /> : <HeartOutlined />} onClick={handleFavorite}>
            {isFavorite ? '取消收藏' : '收藏活动'}
          </Button>
          {favoritesError && <Alert showIcon type="error"
            message={favoriteActionAttempted ? '收藏操作失败' : '收藏加载失败'} description={favoritesError}
            action={<Button onClick={retryFavorites}>重试</Button>} />}
        </Card>
      </section>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}><Card className="detail-section" title="活动详情"><Typography.Paragraph>{activity.description || '暂无详细描述'}</Typography.Paragraph>
          {activity.tags?.length > 0 && <Space wrap>{activity.tags.map(tag => <Tag key={tag}>{tag}</Tag>)}</Space>}
        </Card></Col>
        <Col xs={24} lg={8}><Card className="detail-section" title="活动评价">
          <div className="rating-summary"><strong>{statistics?.averageRating?.toFixed(1) ?? '0.0'}</strong><div><Rate disabled allowHalf value={statistics?.averageRating ?? 0} /><span>{statistics?.totalComments ?? 0} 条评论</span></div></div>
        </Card></Col>
      </Row>

      <Card className="detail-section comments-section" title={`评论（${statistics?.totalComments ?? comments.length}）`}
        extra={canComment && <Button icon={<CommentOutlined />} onClick={() => setCommentModalVisible(true)}>写评论</Button>}>
        {commentsLoading ? <Skeleton active avatar /> : comments.length ? <List dataSource={comments} renderItem={comment => <List.Item>
          <List.Item.Meta avatar={<Avatar src={comment.user?.avatar} icon={<UserOutlined />} />}
            title={<div className="comment-heading"><strong>{comment.user?.username || '匿名用户'}</strong><Rate disabled value={comment.rating} /><Typography.Text type="secondary">{dayjs(comment.createdAt).format('YYYY-MM-DD HH:mm')}</Typography.Text></div>}
            description={<Typography.Paragraph>{comment.content}</Typography.Paragraph>} />
        </List.Item>} /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="还没有评论" />}
      </Card>

      <Modal title="写评论" open={commentModalVisible} onCancel={() => setCommentModalVisible(false)} footer={null} destroyOnHidden>
        <Form form={form} onFinish={handleComment} layout="vertical" initialValues={{ rating: 5 }}>
          <Form.Item label="评分" name="rating" rules={[{ required: true, message: '请给出评分' }]}><Rate /></Form.Item>
          <Form.Item label="评论内容" name="content" rules={[{ required: true, whitespace: true, message: '请输入评论内容' }, { max: 1000, message: '评论不能超过 1000 字' }]}>
            <Input.TextArea rows={5} maxLength={1000} placeholder="分享你的参与体验" showCount />
          </Form.Item>
          <Space><Button type="primary" htmlType="submit" loading={commentLoading}>发布评论</Button><Button onClick={() => setCommentModalVisible(false)}>取消</Button></Space>
        </Form>
      </Modal>
    </div>
  );
};

export default ActivityDetail;
