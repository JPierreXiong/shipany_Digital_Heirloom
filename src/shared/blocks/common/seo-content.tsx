'use client';

import { Card, CardContent } from '@/shared/components/ui/card';
import { cn } from '@/shared/lib/utils';

interface SEOContentProps {
  locale?: string;
  className?: string;
}

export function SEOContent({ locale = 'en', className }: SEOContentProps) {
  // English content
  const enContent = (
    <div className="prose prose-lg max-w-none dark:prose-invert">
      <h2 className="text-2xl font-bold mb-4">
        Secure Your Digital Legacy with Zero-Knowledge Encryption
      </h2>
      
      <p className="mb-4">
        In today's digital age, we accumulate vast amounts of valuable digital assets—cryptocurrency wallets, encrypted files, precious memories, and important documents. But what happens to these assets when you're no longer able to access them? Digital Heirloom provides a secure, automated solution to ensure your digital legacy is safely transferred to your loved ones, using military-grade encryption and automated heartbeat detection.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-3">
        How Digital Heirloom Protects Your Digital Assets
      </h3>
      
      <p className="mb-4">
        Digital Heirloom uses zero-knowledge encryption architecture, meaning your data is encrypted in your browser before it ever reaches our servers. We never see your passwords, encryption keys, or file contents. Combined with automated heartbeat detection and physical key fragmentation, we ensure your digital assets remain secure during your lifetime and are safely transferred only when necessary.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-3">
        Step-by-Step Guide: How to Use Digital Heirloom
      </h3>
      
      <ol className="list-decimal list-inside space-y-2 mb-4">
        <li>
          <strong>Create Your Digital Vault:</strong> Set up your secure digital vault and choose your encryption settings. All data is encrypted locally in your browser.
        </li>
        <li>
          <strong>Add Your Digital Assets:</strong> Upload encrypted files, store cryptocurrency wallet information, or save important documents. Everything is protected with zero-knowledge encryption.
        </li>
        <li>
          <strong>Configure Beneficiaries:</strong> Designate trusted beneficiaries who will receive your digital assets. You can set up multiple beneficiaries with different access levels.
        </li>
        <li>
          <strong>Set Up Heartbeat Detection:</strong> Configure automated check-ins to ensure your vault remains secure. If you become unresponsive, your beneficiaries will be notified and assets will be safely transferred.
        </li>
      </ol>

      <h3 className="text-xl font-semibold mt-6 mb-3">
        Core Advantages of Digital Heirloom
      </h3>
      
      <ul className="list-disc list-inside space-y-2 mb-4">
        <li>
          <strong>Zero-Knowledge Encryption:</strong> Your data is encrypted before leaving your device. Even we cannot access your files or passwords.
        </li>
        <li>
          <strong>Automated Heartbeat Detection:</strong> Periodic check-ins ensure your vault remains secure. If you become unresponsive, your beneficiaries are automatically notified.
        </li>
        <li>
          <strong>Physical Key Fragmentation:</strong> For Pro users, encryption keys are split between digital and physical components, eliminating single points of failure.
        </li>
      </ul>
    </div>
  );

  // Chinese content (中文内容)
  const zhContent = (
    <div className="prose prose-lg max-w-none dark:prose-invert">
      <h2 className="text-2xl font-bold mb-4">
        使用零知识加密保护您的数字遗产
      </h2>
      
      <p className="mb-4">
        在当今数字时代，我们积累了大量的宝贵数字资产——加密货币钱包、加密文件、珍贵回忆和重要文档。但当您无法再访问这些资产时，它们会怎样？Digital Heirloom 提供安全、自动化的解决方案，使用军用级加密和自动化心跳检测，确保您的数字遗产安全传递给您的亲人。
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-3">
        Digital Heirloom 如何保护您的数字资产
      </h3>
      
      <p className="mb-4">
        Digital Heirloom 使用零知识加密架构，这意味着您的数据在到达我们的服务器之前就在您的浏览器中加密。我们永远看不到您的密码、加密密钥或文件内容。结合自动化心跳检测和物理密钥分片，我们确保您的数字资产在您的一生中保持安全，并在必要时安全传递。
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-3">
        分步指南：如何使用 Digital Heirloom
      </h3>
      
      <ol className="list-decimal list-inside space-y-2 mb-4">
        <li>
          <strong>创建您的数字保险箱：</strong>设置您的安全数字保险箱并选择加密设置。所有数据都在您的浏览器中本地加密。
        </li>
        <li>
          <strong>添加您的数字资产：</strong>上传加密文件、存储加密货币钱包信息或保存重要文档。一切都受到零知识加密保护。
        </li>
        <li>
          <strong>配置受益人：</strong>指定将接收您数字资产的受信任受益人。您可以设置多个具有不同访问级别的受益人。
        </li>
        <li>
          <strong>设置心跳检测：</strong>配置自动化签到以确保您的保险箱保持安全。如果您无响应，您的受益人将收到通知，资产将安全传递。
        </li>
      </ol>

      <h3 className="text-xl font-semibold mt-6 mb-3">
        Digital Heirloom 的核心优势
      </h3>
      
      <ul className="list-disc list-inside space-y-2 mb-4">
        <li>
          <strong>零知识加密：</strong>您的数据在离开设备之前就已加密。即使是我们也无法访问您的文件或密码。
        </li>
        <li>
          <strong>自动化心跳检测：</strong>定期签到确保您的保险箱保持安全。如果您无响应，您的受益人会自动收到通知。
        </li>
        <li>
          <strong>物理密钥分片：</strong>对于 Pro 用户，加密密钥在数字和物理组件之间分割，消除了单点故障。
        </li>
      </ul>
    </div>
  );

  // French content
  const frContent = (
    <div className="prose prose-lg max-w-none dark:prose-invert">
      <h2 className="text-2xl font-bold mb-4">
        Sécurisez votre héritage numérique avec le chiffrement à connaissance zéro
      </h2>
      
      <p className="mb-4">
        À l'ère numérique d'aujourd'hui, nous accumulons de vastes quantités d'actifs numériques précieux—portefeuilles de cryptomonnaies, fichiers chiffrés, souvenirs précieux et documents importants. Mais que deviennent ces actifs lorsque vous n'êtes plus en mesure d'y accéder ? Digital Heirloom offre une solution sécurisée et automatisée pour garantir que votre héritage numérique est transféré en toute sécurité à vos proches, en utilisant un chiffrement de niveau militaire et une détection automatique de pulsation.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-3">
        Comment Digital Heirloom protège vos actifs numériques
      </h3>
      
      <p className="mb-4">
        Digital Heirloom utilise une architecture de chiffrement à connaissance zéro, ce qui signifie que vos données sont chiffrées dans votre navigateur avant d'atteindre nos serveurs. Nous ne voyons jamais vos mots de passe, clés de chiffrement ou contenus de fichiers. Combiné à la détection automatique de pulsation et à la fragmentation physique des clés, nous garantissons que vos actifs numériques restent sécurisés pendant votre vie et sont transférés en toute sécurité uniquement lorsque nécessaire.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-3">
        Guide étape par étape : Comment utiliser Digital Heirloom
      </h3>
      
      <ol className="list-decimal list-inside space-y-2 mb-4">
        <li>
          <strong>Créez votre coffre-fort numérique :</strong> Configurez votre coffre-fort numérique sécurisé et choisissez vos paramètres de chiffrement. Toutes les données sont chiffrées localement dans votre navigateur.
        </li>
        <li>
          <strong>Ajoutez vos actifs numériques :</strong> Téléchargez des fichiers chiffrés, stockez des informations de portefeuille de cryptomonnaies ou enregistrez des documents importants. Tout est protégé par un chiffrement à connaissance zéro.
        </li>
        <li>
          <strong>Configurez les bénéficiaires :</strong> Désignez des bénéficiaires de confiance qui recevront vos actifs numériques. Vous pouvez configurer plusieurs bénéficiaires avec différents niveaux d'accès.
        </li>
        <li>
          <strong>Configurez la détection de pulsation :</strong> Configurez des vérifications automatiques pour garantir que votre coffre-fort reste sécurisé. Si vous ne répondez plus, vos bénéficiaires seront notifiés et les actifs seront transférés en toute sécurité.
        </li>
      </ol>

      <h3 className="text-xl font-semibold mt-6 mb-3">
        Les Avantages de Digital Heirloom
      </h3>
      
      <ul className="list-disc list-inside space-y-2 mb-4">
        <li>
          <strong>Chiffrement à connaissance zéro :</strong> Vos données sont chiffrées avant de quitter votre appareil. Même nous ne pouvons pas accéder à vos fichiers ou mots de passe.
        </li>
        <li>
          <strong>Détection automatique de pulsation :</strong> Des vérifications périodiques garantissent que votre coffre-fort reste sécurisé. Si vous ne répondez plus, vos bénéficiaires sont automatiquement notifiés.
        </li>
        <li>
          <strong>Fragmentation physique des clés :</strong> Pour les utilisateurs Pro, les clés de chiffrement sont divisées entre des composants numériques et physiques, éliminant les points de défaillance uniques.
        </li>
      </ul>
    </div>
  );

  // Only show content for English, Chinese and French locales
  if (locale !== 'en' && locale !== 'zh' && locale !== 'fr') {
    return null;
  }

  // Render content based on locale
  let content;
  if (locale === 'zh') {
    content = zhContent;
  } else if (locale === 'fr') {
    content = frContent;
  } else {
    content = enContent;
  }

  return (
    <section className={cn('py-8 md:py-12', className)}>
      <div className="container">
        <Card>
          <CardContent className="pt-6">
            {content}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

