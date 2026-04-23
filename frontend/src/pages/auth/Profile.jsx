import { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Form, Input, Button, Divider, message, Avatar, Tag } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, SaveOutlined } from '@ant-design/icons';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const { Title, Text } = Typography;

const Profile = () => {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [form] = Form.useForm();
  const [passForm] = Form.useForm();

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        name: user.name,
        email: user.email,
        avatar: user.avatar || '',
      });
    }
  }, [user, form]);

  const handleUpdateProfile = async (values) => {
    try {
      setLoading(true);
      const res = await api.put('/auth/update-profile', { name: values.name, avatar: values.avatar });
      message.success('Cập nhật thông tin thành công');
      // Cập nhật lại user trong Context
      const updatedUser = { ...user, name: res.data.name, avatar: res.data.avatar };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (err) {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (values) => {
    try {
      setPassLoading(true);
      await api.put('/auth/change-password', {
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      message.success('Đổi mật khẩu thành công');
      passForm.resetFields();
    } catch (err) {
      message.error(err.response?.data?.message || 'Mật khẩu cũ không chính xác');
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div style={{ padding: '0 16px' }}>
      <div style={{ marginBottom: 16 }}>
        <Title level={3} style={{ color: '#1677ff', margin: 0 }}>Hồ sơ cá nhân</Title>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={8}>
          <Card bordered={false} className="shadow-sm" style={{ textAlign: 'center' }}>
            <Avatar 
              size={120} 
              src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=random&size=128`}
              icon={<UserOutlined />}
              style={{ marginBottom: 16 }}
            />
            <Title level={4} style={{ marginBottom: 4 }}>{user?.name}</Title>
            <Text type="secondary">{user?.email}</Text>
            <div style={{ marginTop: 12 }}>
              <Tag color={user?.role === 'admin' ? 'volcano' : 'blue'} style={{ textTransform: 'uppercase' }}>
                {user?.role}
              </Tag>
            </div>
            <Divider />
            <div style={{ textAlign: 'left' }}>
              <Text type="secondary">Trạng thái:</Text> <Tag color="success">Hoạt động</Tag><br/>
              <Text type="secondary">Ngày tham gia:</Text> <Text strong>{user?.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : 'N/A'}</Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={16}>
          <Card bordered={false} className="shadow-sm" title="Thông tin cơ bản">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleUpdateProfile}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="name"
                    label="Họ và tên"
                    rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                  >
                    <Input prefix={<UserOutlined />} placeholder="Nhập họ tên" size="large" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="email"
                    label="Email (Không thể thay đổi)"
                  >
                    <Input prefix={<MailOutlined />} disabled size="large" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item
                    name="avatar"
                    label="Avatar (URL)"
                    rules={[
                      {
                        validator: async (_, value) => {
                          const v = String(value || '').trim();
                          if (!v) return;
                          try {
                            const u = new URL(v);
                            if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('bad_protocol');
                          } catch {
                            throw new Error('Vui lòng nhập URL hợp lệ (http/https)');
                          }
                        }
                      }
                    ]}
                  >
                    <Input placeholder="https://..." size="large" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item>
                <Button type="primary" icon={<SaveOutlined />} htmlType="submit" loading={loading} size="large">
                  Lưu thay đổi
                </Button>
              </Form.Item>
            </Form>

            <Divider />

            <Title level={5} style={{ marginBottom: 16 }}>Đổi mật khẩu</Title>
            <Form
              form={passForm}
              layout="vertical"
              onFinish={handleChangePassword}
            >
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item
                    name="oldPassword"
                    label="Mật khẩu hiện tại"
                    rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}
                  >
                    <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu cũ" size="large" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="newPassword"
                    label="Mật khẩu mới"
                    rules={[
                      { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                      { min: 6, message: 'Mật khẩu phải từ 6 ký tự' }
                    ]}
                  >
                    <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu mới" size="large" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="confirmPassword"
                    label="Xác nhận mật khẩu mới"
                    dependencies={['newPassword']}
                    rules={[
                      { required: true, message: 'Vui lòng xác nhận mật khẩu mới' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('newPassword') === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error('Mật khẩu xác nhận không khớp'));
                        },
                      }),
                    ]}
                  >
                    <Input.Password prefix={<LockOutlined />} placeholder="Xác nhận mật khẩu mới" size="large" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item>
                <Button type="default" danger icon={<LockOutlined />} htmlType="submit" loading={passLoading} size="large">
                  Cập nhật mật khẩu
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Profile;
