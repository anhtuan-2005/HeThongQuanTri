import React, { useEffect, useState } from 'react';
import { Button, Card, Col, DatePicker, Form, Input, Modal, Popconfirm, Radio, Row, Space, Table, Tabs, Typography, message } from 'antd';
import { PlusCircleOutlined, EditOutlined, DeleteOutlined, UndoOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../api/axios';

const { Title, Text } = Typography;

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [editingId, setEditingId] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [form] = Form.useForm();

  // Hỗ trợ cả 2 định dạng naming convention (camelCase hoặc snake_case)
  const activeCustomers = customers.filter(c => !c.isDeleted && !c.is_deleted);
  const trashedCustomers = customers.filter(c => c.isDeleted || c.is_deleted);

  const fetchCustomers = async (q = '') => {
    try {
      setLoading(true);
      const res = await api.get('/customers', { params: q ? { q } : {} });
      setCustomers(res.data || []);
    } catch (err) {
      message.error(err.response?.data?.message || 'Lỗi khi tải danh sách khách hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const showAddModal = () => {
    setModalMode('add');
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ gender: 'other' });
    setIsModalOpen(true);
  };

  const showEditModal = (record) => {
    setModalMode('edit');
    setEditingId(record.id);
    form.setFieldsValue({
      name: record.name,
      phone: record.phone,
      address: record.address,
      gender: record.gender || 'other',
      birthday: record.birthday ? dayjs(record.birthday) : null,
    });
    setIsModalOpen(true);
  };

  const handleSoftDelete = async (id) => {
    try {
      await api.put(`/customers/${id}/trash`);
      message.success('Đã chuyển khách hàng vào thùng rác');
      fetchCustomers();
    } catch (err) {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra khi xóa mềm');
    }
  };

  const handleRestore = async (id) => {
    try {
      await api.put(`/customers/${id}/restore`);
      message.success('Đã khôi phục khách hàng');
      fetchCustomers();
    } catch (err) {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra khi khôi phục');
    }
  };

  const handleHardDelete = async (id) => {
    try {
      await api.delete(`/customers/${id}`);
      message.success('Đã xóa vĩnh viễn khách hàng');
      fetchCustomers();
    } catch (err) {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra khi xóa');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitLoading(true);

      const payload = {
        name: String(values.name || '').trim(),
        phone: String(values.phone || '').trim(),
        address: values.address ? String(values.address).trim() : null,
        gender: values.gender,
        birthday: values.birthday ? values.birthday.format('YYYY-MM-DD') : null,
      };

      if (modalMode === 'add') {
        const res = await api.post('/customers', payload);
        message.success('Thêm khách hàng thành công');
        setIsModalOpen(false);
        form.resetFields();
        fetchCustomers();
        return res;
      }

      await api.put(`/customers/${editingId}`, payload);
      message.success('Cập nhật khách hàng thành công');
      setIsModalOpen(false);
      form.resetFields();
      fetchCustomers();
    } catch (err) {
      if (err?.errorFields) return;
      message.error(err.response?.data?.message || 'Lỗi khi lưu khách hàng');
    } finally {
      setSubmitLoading(false);
    }
  };

  const columns = [
    { title: 'Họ tên', dataIndex: 'name', key: 'name' },
    {
      title: 'Ngày sinh',
      dataIndex: 'birthday',
      key: 'birthday',
      width: 120,
      render: v => v ? dayjs(v).format('DD/MM/YYYY') : <Text type="secondary">N/A</Text>
    },
    { title: 'SĐT', dataIndex: 'phone', key: 'phone', width: 140 },
    { title: 'Địa chỉ', dataIndex: 'address', key: 'address', ellipsis: true },
    {
      title: 'Giới tính',
      dataIndex: 'gender',
      key: 'gender',
      width: 110,
      render: v => {
        const g = String(v || 'other');
        if (g === 'male') return 'Nam';
        if (g === 'female') return 'Nữ';
        return 'Khác';
      }
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 220,
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => showEditModal(record)}>
            Sửa
          </Button>
          <Popconfirm
            title="Chuyển vào thùng rác?"
            description="Bạn có chắc chắn muốn chuyển khách hàng này vào thùng rác?"
            okText="Chuyển"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleSoftDelete(record.id)}
          >
            <Button danger ghost icon={<DeleteOutlined />}>
              Thùng rác
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const trashColumns = [
    { title: 'Họ tên', dataIndex: 'name', key: 'name' },
    { title: 'SĐT', dataIndex: 'phone', key: 'phone' },
    {
      title: 'Hành động',
      key: 'action',
      width: 280,
      render: (_, record) => (
        <Space>
          <Button icon={<UndoOutlined />} onClick={() => handleRestore(record.id)}>
            Khôi phục
          </Button>
          <Popconfirm
            title="Xóa VĨNH VIỄN?"
            description="Không thể hoàn tác. Bạn chắc chắn chứ?"
            okText="Xóa vĩnh viễn"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleHardDelete(record.id)}
          >
            <Button danger icon={<DeleteOutlined />}>
              Xóa vĩnh viễn
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '0 16px' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }} className="!text-slate-100">Quản lý Khách Hàng</Title>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusCircleOutlined />} size="large" onClick={showAddModal} className="rounded-lg shadow-[0_16px_35px_rgba(99,102,241,0.18)]">
            Thêm khách hàng
          </Button>
        </Col>
      </Row>

      <Card bordered={false} className="rounded-2xl">
        <Tabs
          defaultActiveKey="active"
          items={[
            {
              key: 'active',
              label: 'Đang hoạt động',
              children: (
                <Table
                  columns={columns}
                  dataSource={activeCustomers}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                />
              )
            },
            {
              key: 'trash',
              label: `Thùng rác (${trashedCustomers.length})`,
              children: (
                <Table
                  columns={trashColumns}
                  dataSource={trashedCustomers}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                />
              )
            }
          ]}
        />
      </Card>

      <Modal
        title={modalMode === 'add' ? 'Thêm Khách Hàng' : 'Cập Nhật Khách Hàng'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        confirmLoading={submitLoading}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }} initialValues={{ gender: 'other' }}>
          <Form.Item
            name="name"
            label="Họ tên (*)"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
          >
            <Input placeholder="VD: Nguyễn Văn A" size="large" />
          </Form.Item>

          <Form.Item
            name="birthday"
            label="Ngày sinh (*)"
            rules={[
              { required: true, message: 'Vui lòng chọn ngày sinh' },
              {
                validator: (_, value) => {
                  if (value && value.isAfter(dayjs(), 'day')) {
                    return Promise.reject(new Error('Ngày sinh không thể ở tương lai'));
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày sinh" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Số điện thoại (*)"
            rules={[
              { required: true, message: 'Vui lòng nhập số điện thoại' },
              { pattern: /^[0-9+\s()-]{8,20}$/, message: 'Số điện thoại không hợp lệ' }
            ]}
          >
            <Input placeholder="VD: 0987654321" size="large" />
          </Form.Item>

          <Form.Item 
            name="address" 
            label="Địa chỉ (*)"
            rules={[
              { required: true, message: 'Vui lòng nhập địa chỉ' },
              { min: 5, message: 'Địa chỉ phải có ít nhất 5 ký tự' }
            ]}
          >
            <Input placeholder="VD: Hà Nội" size="large" />
          </Form.Item>

          <Form.Item
            name="gender"
            label="Giới tính (*)"
            rules={[{ required: true, message: 'Vui lòng chọn giới tính' }]}
          >
            <Radio.Group>
              <Radio value="male">Nam</Radio>
              <Radio value="female">Nữ</Radio>
              <Radio value="other">Khác</Radio>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CustomerManagement;
