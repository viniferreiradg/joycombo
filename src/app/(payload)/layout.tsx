import '@payloadcms/next/css'
import './custom.css'
import { RootLayout } from '@payloadcms/next/layouts'
import config from '../../../payload.config'
import { importMap } from './admin/importMap'
import { serverFunction } from './actions'
import React from 'react'

type Args = {
  children: React.ReactNode
}

export default async function Layout({ children }: Args) {
  return (
    <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
      {children}
    </RootLayout>
  )
}
