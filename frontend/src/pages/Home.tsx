import React, { useEffect, useState } from 'react';
import { Alert, Button, Col, Empty, Row, Skeleton, Space, Typography } from 'antd';
import { ArrowRightOutlined, CalendarOutlined, EnvironmentOutlined, TeamOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { activityAPI, type Activity } from '../api/activity';
import ActivityCard from '../components/ActivityCard';
import './Home.css';

const { Title, Paragraph, Text } = Typography;

const Home: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    activityAPI.getActivities({ limit: 6, sortBy: 'createdAt', sortOrder: 'desc' })
      .then(response => setActivities(response.data.activities))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="hero-copy">
          <Text className="hero-eyebrow">校园运动，从这里开始</Text>
          <Title>找到伙伴，一起去运动</Title>
          <Paragraph>浏览附近的校园体育活动，查看时间和剩余名额，几步即可完成报名。</Paragraph>
          <Space wrap size={12}>
            <Link to="/activities"><Button type="primary" size="large">浏览活动 <ArrowRightOutlined /></Button></Link>
            <Link to="/about"><Button size="large">了解 UniMove</Button></Link>
          </Space>
        </div>
        <div className="hero-panel" aria-label="平台功能概览">
          <div><CalendarOutlined /><span><strong>活动清晰</strong><small>时间、地点与名额一目了然</small></span></div>
          <div><TeamOutlined /><span><strong>报名简单</strong><small>统一管理参加的活动和订单</small></span></div>
          <div><EnvironmentOutlined /><span><strong>就在身边</strong><small>按项目和地点快速筛选</small></span></div>
        </div>
      </section>

      <section className="home-section" aria-labelledby="latest-title">
        <div className="section-heading">
          <div>
            <Text type="secondary">最近发布</Text>
            <Title level={2} id="latest-title">看看有什么新活动</Title>
          </div>
          <Link to="/activities">查看全部 <ArrowRightOutlined /></Link>
        </div>

        {failed && <Alert showIcon type="warning" message="暂时无法加载活动" description="你仍可以前往活动列表稍后重试。" />}
        {loading ? (
          <Row gutter={[20, 20]}>{[0, 1, 2].map(item => <Col xs={24} md={12} lg={8} key={item}><div className="home-skeleton"><Skeleton active /></div></Col>)}</Row>
        ) : activities.length > 0 ? (
          <Row gutter={[20, 20]}>{activities.map(activity => <Col xs={24} md={12} lg={8} key={activity._id}><ActivityCard activity={activity} showActions={false} /></Col>)}</Row>
        ) : !failed ? <Empty description="暂时还没有活动" /> : null}
      </section>

      <section className="home-cta">
        <div><Title level={2}>准备好了吗？</Title><Paragraph>登录后即可报名活动，并在个人中心管理订单和评论。</Paragraph></div>
        <Link to="/register"><Button type="primary" size="large">创建账号</Button></Link>
      </section>
    </div>
  );
};

export default Home;
