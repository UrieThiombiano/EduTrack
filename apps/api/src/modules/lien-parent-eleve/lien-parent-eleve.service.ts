import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLienParentEleveDto } from './dto/create-lien.dto';

@Injectable()
export class LienParentEleveService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEleve(eleveId: number, etablissementId: number) {
    const eleve = await this.prisma.eleve.findFirst({
      where: { id_eleve: eleveId, utilisateur: { id_etablissement: etablissementId } },
    });
    if (!eleve) throw new NotFoundException(`Élève #${eleveId} introuvable`);

    return this.prisma.lienParentEleve.findMany({
      where: { id_eleve: eleveId },
      include: {
        parent: {
          include: { utilisateur: { select: { nom: true, prenom: true, email: true, telephone: true } } },
        },
      },
    });
  }

  async findByParent(parentId: number, etablissementId: number) {
    const parent = await this.prisma.parent.findFirst({
      where: { id_parent: parentId, utilisateur: { id_etablissement: etablissementId } },
    });
    if (!parent) throw new NotFoundException(`Parent #${parentId} introuvable`);

    return this.prisma.lienParentEleve.findMany({
      where: { id_parent: parentId },
      include: {
        eleve: {
          include: { utilisateur: { select: { nom: true, prenom: true } } },
        },
      },
    });
  }

  async create(dto: CreateLienParentEleveDto, etablissementId: number) {
    const [parent, eleve] = await Promise.all([
      this.prisma.parent.findFirst({ where: { id_parent: dto.id_parent, utilisateur: { id_etablissement: etablissementId } } }),
      this.prisma.eleve.findFirst({ where: { id_eleve: dto.id_eleve, utilisateur: { id_etablissement: etablissementId } } }),
    ]);

    if (!parent) throw new NotFoundException(`Parent #${dto.id_parent} introuvable`);
    if (!eleve) throw new NotFoundException(`Élève #${dto.id_eleve} introuvable`);

    const exists = await this.prisma.lienParentEleve.findUnique({
      where: { id_parent_id_eleve: { id_parent: dto.id_parent, id_eleve: dto.id_eleve } },
    });
    if (exists) throw new ConflictException('Ce lien parent-élève existe déjà');

    return this.prisma.lienParentEleve.create({
      data: dto,
      include: {
        parent: { include: { utilisateur: { select: { nom: true, prenom: true } } } },
        eleve: { include: { utilisateur: { select: { nom: true, prenom: true } } } },
      },
    });
  }

  async update(id: number, dto: Partial<CreateLienParentEleveDto>, etablissementId: number) {
    const lien = await this.prisma.lienParentEleve.findFirst({
      where: { id_lien: id, parent: { utilisateur: { id_etablissement: etablissementId } } },
    });
    if (!lien) throw new NotFoundException(`Lien #${id} introuvable`);

    return this.prisma.lienParentEleve.update({
      where: { id_lien: id },
      data: { type_lien: dto.type_lien, est_contact_principal: dto.est_contact_principal },
    });
  }

  async remove(id: number, etablissementId: number) {
    const lien = await this.prisma.lienParentEleve.findFirst({
      where: { id_lien: id, parent: { utilisateur: { id_etablissement: etablissementId } } },
    });
    if (!lien) throw new NotFoundException(`Lien #${id} introuvable`);
    return this.prisma.lienParentEleve.delete({ where: { id_lien: id } });
  }
}
