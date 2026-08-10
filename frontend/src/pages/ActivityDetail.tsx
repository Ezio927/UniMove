import React from 'react';
import {
  Card,
  Button,
  Typography,
  Tag,
  Space,
  Avatar,
  Divider,
  Modal,
  Form,
  Input,
  Rate,
  List,
  Spin,
  Row,
  Col,
  Statistic
} from 'antd';
import {
  CalendarOutlined,
  EnvironmentOutlined,
  UserOutlined,
  TeamOutlined,
  CommentOutlined,
  StarOutlined,
  HeartOutlined,
  ShareAltOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useActivityDetail } from '../hooks/useActivityDetail';
import './ActivityDetail.css';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

const ActivityDetail: React.FC = () => {
  const { activity, comments, loading, enrolling, cancelling,
    commentModalVisible, setCommentModalVisible, commentLoading,
    userEnrollmentStatus, form, handleEnroll, handleCancelEnrollment,
    handleComment } = useActivityDetail();

  if (loading) {
    return (
      <div className="activity-detail-loading">
        <Spin size="large" />
      </div>
    );
  }

  if (!activity) {
    return null;
  }

  const isEnrollable = activity.maxParticipants > activity.currentParticipants;
  const enrollmentRate = (activity.currentParticipants / activity.maxParticipants) * 100;

  return (
    <div className="activity-detail-container">
      <Card className="activity-detail-card">
        {/* 活动头部信息 */}
        <div className="activity-header">
          <div className="activity-image">
            <img
              src={(activity.images && activity.images[0]) || '/api/placeholder/600/300'}
              alt={activity.title}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/api/placeholder/600/300';
              }}
            />
          </div>
          
          <div className="activity-info">
            <Title level={1}>{activity.title}</Title>
            
            <Space wrap className="activity-tags">
              <Tag color="blue">{activity.category}</Tag>
              <Tag color={isEnrollable ? 'green' : 'red'}>
                {isEnrollable ? '可报名' : '已满员'}
              </Tag>
            </Space>

            <div className="activity-meta">
              <Space direction="vertical" size="small">
                <Space>
                  <CalendarOutlined />
                  <Text>{dayjs(activity.startTime).format('YYYY-MM-DD HH:mm')}</Text>
                  <Text type="secondary">至</Text>
                  <Text>{dayjs(activity.endTime).format('YYYY-MM-DD HH:mm')}</Text>
                </Space>
                
                <Space>
                  <EnvironmentOutlined />
                  <Text>{activity.location}</Text>
                </Space>
                
                <Space>
                  <UserOutlined />
                  <Text>组织者：{activity.organizer?.username || '未知'}</Text>
                </Space>
              </Space>
            </div>

            <Row gutter={16} className="activity-stats">
              <Col span={8}>
                <Statistic
                  title="当前人数"
                  value={activity.currentParticipants}
                  suffix={`/ ${activity.maxParticipants}`}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="报名率"
                  value={enrollmentRate}
                  precision={1}
                  suffix="%"
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="评论数"
                  value={comments.length}
                />
              </Col>
            </Row>

            <div className="activity-actions">
              <Space>
                {!userEnrollmentStatus ? (
                  <Button
                    type="primary"
                    size="large"
                    loading={enrolling}
                    disabled={!isEnrollable}
                    onClick={handleEnroll}
                    icon={<TeamOutlined />}
                  >
                    {isEnrollable ? '立即报名' : '已满员'}
                  </Button>
                ) : (
                  <Space>
                    <Button
                      type="default"
                      size="large"
                      disabled
                      icon={<TeamOutlined />}
                    >
                      已报名
                    </Button>
                    <Button
                      type="primary"
                      danger
                      size="large"
                      loading={cancelling}
                      onClick={handleCancelEnrollment}
                    >
                      取消报名
                    </Button>
                  </Space>
                )}
                
                <Button
                  size="large"
                  disabled={!userEnrollmentStatus}
                  onClick={() => setCommentModalVisible(true)}
                  icon={<CommentOutlined />}
                >
                  写评论
                </Button>
                
                <Button size="large" icon={<HeartOutlined />}>
                  收藏
                </Button>
                
                <Button size="large" icon={<ShareAltOutlined />}>
                  分享
                </Button>
              </Space>
            </div>
          </div>
        </div>

        <Divider />

        {/* 活动描述 */}
        <div className="activity-description">
          <Title level={3}>活动详情</Title>
          <Paragraph>
            {activity.description || '暂无详细描述'}
          </Paragraph>
        </div>

        <Divider />

        {/* 评论区 */}
        <div className="activity-comments">
          <Title level={3}>
            评论 ({comments.length})
            <Button
              type="link"
              onClick={() => setCommentModalVisible(true)}
              icon={<CommentOutlined />}
            >
              写评论
            </Button>
          </Title>
          
          <List
            dataSource={comments}
            renderItem={(comment) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar icon={<UserOutlined />} />}
                  title={
                    <Space>
                      <Text strong>{comment.user?.username || '匿名用户'}</Text>
                      <Rate disabled defaultValue={comment.rating} />
                      <Text type="secondary">
                        {dayjs(comment.createdAt).format('YYYY-MM-DD HH:mm')}
                      </Text>
                    </Space>
                  }
                  description={comment.content}
                />
              </List.Item>
            )}
            locale={{
              emptyText: '暂无评论，快来抢沙发吧！'
            }}
          />
        </div>
      </Card>

      {/* 评论模态框 */}
      <Modal
        title="写评论"
        open={commentModalVisible}
        onCancel={() => setCommentModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          onFinish={handleComment}
          layout="vertical"
        >
          <Form.Item
            label="评分"
            name="rating"
            initialValue={5}
            rules={[{ required: true, message: '请给出评分' }]}
          >
            <Rate />
          </Form.Item>
          
          <Form.Item
            label="评论内容"
            name="content"
            rules={[
              { required: true, message: '请输入评论内容' }
            ]}
          >
            <TextArea
              rows={4}
              placeholder="分享你的参与体验..."
              showCount
            />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={commentLoading}
                icon={<StarOutlined />}
              >
                发布评论
              </Button>
              <Button onClick={() => setCommentModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ActivityDetail;
