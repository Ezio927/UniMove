import React from 'react';
import {
  Card,
  Tabs,
  Avatar,
  Typography,
  Button,
  Table,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Rate,
  Descriptions,
  Statistic,
  Row,
  Col,
  Empty
} from 'antd';
import {
  UserOutlined,
  EditOutlined,
  CalendarOutlined,
  TeamOutlined,
  CommentOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Order } from '../api/order';
import type { Comment } from '../api/comment';
import { useProfile } from '../hooks/useProfile';
import './Profile.css';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const Profile: React.FC = () => {
  const {
    user, editModalVisible, setEditModalVisible, loading, orders, comments,
    ordersLoading, commentsLoading, editCommentModalVisible,
    setEditCommentModalVisible, setEditingComment,
    form, commentForm, handleCancelOrder, handleEditComment,
    handleDeleteComment, handleUpdateComment, handleUpdateProfile
  } = useProfile();

  const orderColumns = [
    {
      title: '活动名称',
      dataIndex: ['activity', 'title'],
      key: 'title',
      render: (title: string) => <Text strong>{title}</Text>,
    },
    {
      title: '报名时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '活动时间',
      dataIndex: ['activity', 'startTime'],
      key: 'startTime',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusConfig = {
          pending: { color: 'orange', text: '待支付' },
          paid: { color: 'green', text: '已支付' },
          cancelled: { color: 'red', text: '已取消' },
          refunded: { color: 'blue', text: '已退款' },
        };
        const config = statusConfig[status as keyof typeof statusConfig] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'actions',
      render: (_text: string, record: Order) => (
        <Space>
          <Button
            type="link"
            onClick={() => window.open(`/activities/${record.activity._id}`, '_blank')}
          >
            查看详情
          </Button>
          {record.status === 'paid' && (
            <Button
              type="link"
              danger
              onClick={() => handleCancelOrder(record._id)}
            >
              取消报名
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const commentColumns = [
    {
      title: '活动名称',
      dataIndex: ['activity', 'title'],
      key: 'title',
      render: (title: string) => <Text strong>{title}</Text>,
    },
    {
      title: '评分',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating: number) => (
        <Space>
          <TrophyOutlined style={{ color: '#faad14' }} />
          <Text>{rating}/5</Text>
        </Space>
      ),
    },
    {
      title: '评论内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
    },
    {
      title: '评论时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_text: string, record: Comment) => (
        <Space>
          <Button
            type="link"
            onClick={() => handleEditComment(record)}
          >
            修改
          </Button>
          <Button
            type="link"
            danger
            onClick={() => handleDeleteComment(record._id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  if (!user) {
    return (
      <div className="profile-container">
        <Empty description="请先登录" />
      </div>
    );
  }

  const completedOrders = orders.filter(order => order.status === 'paid').length;
  const averageRating = comments.length > 0 
    ? comments.reduce((sum, comment) => sum + comment.rating, 0) / comments.length 
    : 0;

  return (
    <div className="profile-container">
      <Card className="profile-header-card">
        <div className="profile-header">
          <Avatar
            size={120}
            icon={<UserOutlined />}
            className="profile-avatar"
          />
          
          <div className="profile-info">
            <Title level={2}>{user.username}</Title>
            <Text type="secondary">{user.email}</Text>
            {user.phone && (
              <div>
                <Text type="secondary">{user.phone}</Text>
              </div>
            )}
            <div className="profile-role">
              <Tag color={user.role === 'admin' ? 'red' : 'blue'}>
                {user.role === 'admin' ? '管理员' : '普通用户'}
              </Tag>
            </div>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => {
                form.setFieldsValue({
                  username: user.username,
                  phone: user.phone || '',
                });
                setEditModalVisible(true);
              }}
            >
              编辑资料
            </Button>
          </div>

          <div className="profile-stats">
            <Row gutter={24}>
              <Col span={8}>
                <Statistic
                  title="参与活动"
                  value={orders.length}
                  prefix={<CalendarOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="完成活动"
                  value={completedOrders}
                  prefix={<TeamOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="平均评分"
                  value={averageRating}
                  precision={1}
                  prefix={<TrophyOutlined />}
                />
              </Col>
            </Row>
          </div>
        </div>
      </Card>

      <Card className="profile-content-card">
        <Tabs defaultActiveKey="orders" size="large">
          <TabPane tab="我的报名" key="orders" icon={<CalendarOutlined />}>
            <Table
              columns={orderColumns}
              dataSource={orders}
              loading={ordersLoading}
              rowKey="_id"
              pagination={{
                pageSize: 10,
                showSizeChanger: false,
                showQuickJumper: true,
              }}
              locale={{
                emptyText: '暂无报名记录'
              }}
            />
          </TabPane>

          <TabPane tab="我的评论" key="comments" icon={<CommentOutlined />}>
            <Table
              columns={commentColumns}
              dataSource={comments}
              loading={commentsLoading}
              rowKey="_id"
              pagination={{
                pageSize: 10,
                showSizeChanger: false,
                showQuickJumper: true,
              }}
              locale={{
                emptyText: '暂无评论记录'
              }}
            />
          </TabPane>

          <TabPane tab="账户信息" key="account" icon={<UserOutlined />}>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="用户名">{user.username}</Descriptions.Item>
              <Descriptions.Item label="邮箱">{user.email}</Descriptions.Item>
              <Descriptions.Item label="手机号">{user.phone || '未设置'}</Descriptions.Item>
              <Descriptions.Item label="用户类型">
                <Tag color={user.role === 'admin' ? 'red' : 'blue'}>
                  {user.role === 'admin' ? '管理员' : '普通用户'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="注册时间">
                {dayjs(user.createdAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
            </Descriptions>
          </TabPane>
        </Tabs>
      </Card>

      {/* 编辑资料模态框 */}
      <Modal
        title="编辑资料"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          onFinish={handleUpdateProfile}
          layout="vertical"
          size="large"
        >
          <Form.Item
            label="用户名"
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3位' },
              { max: 20, message: '用户名最多20位' }
            ]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>

          <Form.Item
            label="手机号"
            name="phone"
            rules={[
              { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }
            ]}
          >
            <Input placeholder="请输入手机号（可选）" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                保存
              </Button>
              <Button onClick={() => setEditModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑评论模态框 */}
      <Modal
        title="修改评论"
        open={editCommentModalVisible}
        onCancel={() => {
          setEditCommentModalVisible(false);
          setEditingComment(null);
          commentForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={commentForm}
          onFinish={handleUpdateComment}
          layout="vertical"
        >
          <Form.Item
            label="评分"
            name="rating"
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
            <Input.TextArea
              rows={4}
              placeholder="分享你的参与体验..."
              showCount
            />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                保存修改
              </Button>
              <Button onClick={() => {
                setEditCommentModalVisible(false);
                setEditingComment(null);
                commentForm.resetFields();
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Profile;
