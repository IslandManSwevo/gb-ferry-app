'use client';

import { GlobalOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Card, DatePicker, Form, Input, message, Select } from 'antd';
import React from 'react';

export default function USPassengerCheckinPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  const handleUSPassengerSubmit = async (values: any) => {
    setLoading(true);
    try {
      // Mock API call
      console.log('Submitting US passenger data:', values);

      // In a real implementation:
      // await fetch('/api/passengers/us-checkin', { method: 'POST', body: JSON.stringify(values) });

      await new Promise((resolve) => setTimeout(resolve, 1000));
      message.success('Passenger checked in for US route successfully');
      form.resetFields();
    } catch (error) {
      console.error(error);
      message.error('Failed to check in passenger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '24px auto', padding: '0 24px' }}>
      <Card title="US Route Passenger Check-in (CBP/APIS)" bordered={false} loading={false}>
        <div style={{ marginBottom: 24, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
          <p style={{ margin: 0, color: '#666' }}>
            <GlobalOutlined style={{ marginRight: 8 }} />
            This form collects additional data required by US Customs and Border Protection (CBP)
            for routes touching US ports (Fort Lauderdale, Port Everglades, Miami).
          </p>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleUSPassengerSubmit}
          initialValues={{
            nationality: 'BHS',
            passportCountry: 'BHS',
          }}
        >
          {/* Basic Passenger Info (Existing Reuse) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item
              name="familyName"
              label="Last Name"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="As needed for travel" />
            </Form.Item>

            <Form.Item
              name="givenNames"
              label="First Name"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Input placeholder="As needed for travel" />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="nationality" label="Nationality" rules={[{ required: true }]}>
              <Input placeholder="ISO Code (e.g. BHS)" />
            </Form.Item>
            <Form.Item name="dateOfBirth" label="Date of Birth" rules={[{ required: true }]}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </div>

          {/* US Specific Fields */}
          <h3
            style={{
              marginTop: 24,
              marginBottom: 16,
              borderBottom: '1px solid #eee',
              paddingBottom: 8,
            }}
          >
            US Entry Requirements
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item
              name="visaType"
              label="Visa Type / Entry Document"
              rules={[{ required: true, message: 'Required for US entry' }]}
            >
              <Select placeholder="Select Visa Type">
                <Select.Option value="B1">B1 (Business)</Select.Option>
                <Select.Option value="B2">B2 (Tourist)</Select.Option>
                <Select.Option value="B1/B2">B1/B2 (Business/Tourist)</Select.Option>
                <Select.Option value="ESTA">ESTA (Visa Waiver)</Select.Option>
                <Select.Option value="F1">F1 (Student)</Select.Option>
                <Select.Option value="US_CITIZEN">US Citizen (Passport)</Select.Option>
                <Select.Option value="LPR">Lawful Permanent Resident (Green Card)</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item name="i94Number" label="I-94 Number / Admission Number">
              <Input placeholder="From previous entry if applicable" />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="passportNumber" label="Passport Number" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item
              name="passportCountry"
              label="Passport Issuing Country"
              rules={[{ required: true }]}
            >
              <Input placeholder="ISO Code (e.g. BHS)" />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="passportExpiry" label="Passport Expiry" rules={[{ required: true }]}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="addressWhileInUS"
              label="Address While in US"
              rules={[{ required: false }]}
            >
              <Input placeholder="Hotel or Street Address" />
            </Form.Item>
          </div>

          <Form.Item style={{ marginTop: 16 }}>
            <Button type="primary" htmlType="submit" size="large" block loading={loading}>
              Check In (US Route)
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
