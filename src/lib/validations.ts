import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim(),
  password: z.string().min(1, "A senha é obrigatória"),
  modulo: z.enum(['financas', 'equipe']).optional()
}).superRefine((data, ctx) => {
  // Se o módulo for equipe, e-mail é obrigatório e deve ser válido.
  // Se o módulo for financas, e-mail é opcional (fallback local), mas se preenchido, deve ser um e-mail válido.
  if (data.modulo === 'equipe') {
    if (!data.email || data.email.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "O e-mail é obrigatório",
        path: ["email"]
      });
    } else {
      const emailParse = z.string().email("E-mail inválido").safeParse(data.email);
      if (!emailParse.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: emailParse.error.issues[0].message,
          path: ["email"]
        });
      }
    }
  } else if (data.modulo === 'financas' && data.email && data.email.trim() !== '') {
    const emailParse = z.string().email("E-mail inválido").safeParse(data.email);
    if (!emailParse.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: emailParse.error.issues[0].message,
        path: ["email"]
      });
    }
  }
});

export const cadastroSchema = z.object({
  nome: z.string().trim().min(3, "O nome deve ter pelo menos 3 caracteres"),
  email: z.string().trim().email("E-mail inválido"),
  whatsapp: z.string().trim().min(10, "WhatsApp deve ter pelo menos 10 caracteres"),
  senha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  confirmarSenha: z.string().min(1, "Confirme sua senha"),
  perfil: z.enum(['financas', 'equipe']).optional().default('equipe'),
  equipe: z.string().optional()
}).refine((data) => data.senha === data.confirmarSenha, {
  message: "As senhas não conferem",
  path: ["confirmarSenha"]
}).refine((data) => {
  if (data.perfil === 'equipe') {
    return ['Comando', 'Fichas', 'Pós-encontro', 'Montagem', 'Palestra'].includes(data.equipe || '');
  }
  return true;
}, {
  message: "Selecione uma equipe válida",
  path: ["equipe"]
});

export const reembolsoSchema = z.object({
  nome_pagador: z.string().trim().min(3, "Nome do pagador deve ter pelo menos 3 caracteres"),
  equipe: z.string().min(1, "Selecione a equipe da despesa"),
  descricao: z.string().trim().min(3, "A descrição deve ter pelo menos 3 caracteres"),
  finalidade: z.string().trim().min(5, "A finalidade deve ter pelo menos 5 caracteres"),
  valor: z.coerce.number().positive("O valor deve ser maior que R$ 0,00"),
  chave_pix: z.string().trim().min(1, "A chave PIX é obrigatória"),
});

export const pagamentoSchema = z.object({
  descricao: z.string().trim().min(3, "A descrição deve ter pelo menos 3 caracteres"),
  finalidade: z.string().trim().min(5, "A finalidade deve ter pelo menos 5 caracteres"),
  fornecedor: z.string().trim().min(2, "O fornecedor deve ter pelo menos 2 caracteres"),
  equipe: z.string().min(1, "Selecione a equipe/centro de custo"),
  valor_total: z.coerce.number().positive("O valor deve ser maior que R$ 0,00"),
  data_vencimento: z.string().min(1, "A data de vencimento é obrigatória"),
  metodo_pagamento: z.enum(['pix', 'transferencia', 'boleto'], {
    message: "Selecione uma forma de pagamento"
  }),
  chave_pix: z.string().optional(),
  pix_nome: z.string().optional(),
  pix_banco: z.string().optional(),
  banco: z.string().optional(),
  agencia: z.string().optional(),
  conta: z.string().optional(),
  cpf_cnpj: z.string().optional(),
  codigo_barras: z.string().optional(),
  observacoes: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.metodo_pagamento === 'pix') {
    if (!data.chave_pix || data.chave_pix.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A Chave PIX é obrigatória para pagamentos via PIX",
        path: ["chave_pix"]
      });
    }
  } else if (data.metodo_pagamento === 'transferencia') {
    if (!data.banco || data.banco.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "O Banco é obrigatório",
        path: ["banco"]
      });
    }
    if (!data.agencia || data.agencia.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A Agência é obrigatória",
        path: ["agencia"]
      });
    }
    if (!data.conta || data.conta.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A Conta é obrigatória",
        path: ["conta"]
      });
    }
  }
});
