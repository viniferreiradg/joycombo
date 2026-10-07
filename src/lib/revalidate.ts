/**
 * Hook reutilizavel para revalidar o site apos qualquer save no admin.
 * Usado em collections e globals via afterChange / afterDelete.
 */
export async function revalidateSite() {
  try {
    const url = `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'}/revalidate`
    await fetch(url, {
      method: 'POST',
      headers: {
        'x-revalidate-secret': process.env.REVALIDATE_SECRET || 'revalidate-joycombo',
      },
    })
  } catch {
    // Falha silenciosa: nao impede o save no admin
  }
}

// Atalho para os hooks das collections de conteudo
export const revalidateHooks = {
  afterChange: [() => revalidateSite()],
  afterDelete: [() => revalidateSite()],
}
