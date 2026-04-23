import React, { useState, useEffect } from 'react';
import { Table, Tag, Typography, Card, message, Button, Space, Popconfirm, Row, Col, Modal, Form, Input, Select } from 'antd';
import { LockOutlined, UnlockOutlined, PlusCircleOutlined } from '@ant-design/icons';
import api from '../../api/axios';

const { Title, Text } = Typography;

const AccountManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State cho Modal thêm tài khoản
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      message.error(err.message || 'Lỗi khi tải danh sách tài khoản');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      // Đảo ngược trạng thái
      const newStatus = currentStatus === 'active' ? 'locked' : 'active';
      await api.put(`/users/${userId}/status`, { status: newStatus });
      message.success(`Đã cập nhật trạng thái tài khoản thành công`);
      fetchUsers(); // Cập nhật lại danh sách trên màn hình
    } catch (err) {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật tài khoản');
    }
  };
  
  const handleCreateUser = async () => {
    try {
      const values = await form.validateFields();
      setSubmitLoading(true);
      
      const { name, email, password } = values;
      await api.post('/users', { name, email, password, role: 'staff' });
      message.success('Thêm tài khoản nhân viên thành công!');
      setIsModalOpen(false);
      form.resetFields();
      fetchUsers(); // Tải lại danh sách
    } catch (err) {
      if (err.name !== 'ValidationError') {
        message.error(err.response?.data?.message || 'Lỗi xảy ra trong quá trình tạo tài khoản');
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: text => <Text strong>{text}</Text>,
    },
    {
      title: 'Họ và tên',
      dataIndex: 'name',
      key: 'name',
      render: text => <Text strong>{text}</Text>,
    },
    {
      title: 'Thư điện tử (Email)',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      render: date => new Date(date).toLocaleString('vi-VN'),
    },
    {
      title: 'Chức vụ (Role)',
      dataIndex: 'role',
      key: 'role',
      render: role => {
        let color = role === 'admin' ? 'volcano' : 'blue';
        return (
          <Tag color={color} key={role} style={{ textTransform: 'uppercase' }}>
            {role}
          </Tag>
        );
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: status => {
        return status === 'locked' ? (
           <Tag color="error">Đã Khóa</Tag>
        ) : (
           <Tag color="success">Hoạt động</Tag>
        );
      }
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => {
         // Không cho phép tự khóa tài khoản Admin chính mình hoặc khóa tài khoản Admin khác để an toàn
         if (record.role === 'admin') {
           return <Text type="secondary" style={{ fontSize: '13px' }}>Không có quyền</Text>;
         }

         const isLocked = record.status === 'locked';
         return (
            <Popconfirm
               title={isLocked ? "Mở khóa tài khoản này?" : "Khóa tài khoản hệ thống?"}
               description={isLocked ? "Tài khoản sẽ có thể đăng nhập lại." : "Tài khoản sẽ không thể đăng nhập cho đến khi mở lại!"}
               okText="Đồng ý"
               cancelText="Hủy"
               onConfirm={() => handleToggleStatus(record.id, record.status)}
            >
              <Button 
                danger={!isLocked} 
                type={isLocked ? "primary" : "default"} 
                icon={isLocked ? <UnlockOutlined /> : <LockOutlined />}
              >
                 {isLocked ? "Mở Khóa" : "Khóa Lại"}
              </Button>
            </Popconfirm>
         );
      }
    }
  ];

  return (
    <div style={{ padding: '0 16px' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }} className="!text-slate-100">Quản lý Tài Khoản</Title>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusCircleOutlined />} size="large" onClick={() => setIsModalOpen(true)}>
            Thêm tài khoản
          </Button>
        </Col>
      </Row>

      <Card bordered={false} className="rounded-2xl">
        <Table 
          columns={columns} 
          dataSource={users} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="Thêm Tài Khoản Nhân Viên Mới"
        open={isModalOpen}
        onOk={handleCreateUser}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        confirmLoading={submitLoading}
        okText="Tạo tài khoản"
        cancelText="Hủy bỏ"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
          <Form.Item
            name="name"
            label="Họ và tên (*)"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
          >
            <Input placeholder="VD: Nguyễn Văn A" size="large" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Thư điện tử (Email) (*)"
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không đúng định dạng!' }
            ]}
          >
            <Input placeholder="VD: nguyenvana@gmail.com" size="large" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Mật khẩu (*)"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }, { min: 6, message: 'Mật khẩu phải từ 6 ký tự trở lên!' }]}
          >
            <Input.Password placeholder="Nhập mật khẩu" size="large" />
          </Form.Item>
          <Form.Item
            name="role"
            hidden
            initialValue="staff"
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AccountManagement;
